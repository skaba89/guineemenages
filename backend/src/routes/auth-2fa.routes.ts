import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ============================================================
// TWO-FACTOR AUTHENTICATION SETUP
// ============================================================

// Generate a secret for TOTP
function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('base64');
}

// Generate QR code URL for TOTP apps
function generateQRCodeURL(email: string, secret: string): string {
  const issuer = encodeURIComponent('GuinéaManager');
  const account = encodeURIComponent(email);
  const secretBase32 = Buffer.from(secret, 'base64').toString('base64').replace(/=/g, '');
  return `otpauth://totp/${issuer}:${account}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// Verify TOTP code
function verifyTOTP(secret: string, token: string): boolean {
  const secretBuffer = Buffer.from(secret, 'base64');
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -1; i <= 1; i++) {
    const timeCounter = time + i;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigUInt64BE(BigInt(timeCounter));
    
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hmacResult = hmac.digest();
    
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const code = (hmacResult.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  return false;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate recovery codes
function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// ============================================================
// ROUTES
// ============================================================

// GET /api/auth/2fa/status - Get 2FA status
router.get('/2fa/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        email: true,
        telephone: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        method: user.twoFactorMethod || null,
        email: user.email,
        phone: user.telephone ? user.telephone.slice(-4).padStart(user.telephone.length, '*') : null,
      }
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/2fa/setup/initiate - Initiate 2FA setup
router.post('/2fa/setup/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { method } = z.object({
      method: z.enum(['totp', 'sms'])
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (method === 'totp') {
      // Generate TOTP secret
      const secret = generateTOTPSecret();
      const qrCodeUrl = generateQRCodeURL(user.email, secret);
      const recoveryCodes = generateRecoveryCodes();

      // Store temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: secret,
          twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
        }
      });

      res.json({
        success: true,
        data: {
          method: 'totp',
          qrCodeUrl,
          secret: Buffer.from(secret, 'base64').toString('base64').replace(/=/g, ''),
          recoveryCodes,
        }
      });
    } else if (method === 'sms') {
      if (!user.telephone) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone requis pour SMS 2FA'
        });
      }

      // Generate and send OTP via SMS
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorOTP: otp,
          twoFactorOTPExpiry: otpExpiry,
        }
      });

      // TODO: Send SMS via Twilio or local SMS gateway
      // For now, return the OTP in development
      res.json({
        success: true,
        data: {
          method: 'sms',
          phone: user.telephone.slice(-4).padStart(user.telephone.length, '*'),
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          message: 'Code OTP envoyé par SMS'
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/2fa/setup/verify - Verify and enable 2FA
router.post('/2fa/setup/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = z.object({
      code: z.string().min(6).max(6)
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    let valid = false;
    const method = user.twoFactorSecret ? 'totp' : 'sms';

    if (user.twoFactorSecret) {
      // Verify TOTP
      valid = verifyTOTP(user.twoFactorSecret, code);
    } else if (user.twoFactorOTP && user.twoFactorOTPExpiry) {
      // Verify SMS OTP
      if (user.twoFactorOTP === code && new Date() < user.twoFactorOTPExpiry) {
        valid = true;
      }
    }

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: method,
        twoFactorOTP: null,
        twoFactorOTPExpiry: null,
      }
    });

    res.json({
      success: true,
      message: 'Authentification à deux facteurs activée avec succès',
      data: {
        method,
        recoveryCodes: user.twoFactorRecoveryCodes ? JSON.parse(user.twoFactorRecoveryCodes) : []
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('2FA verify error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/2fa/verify - Verify 2FA during login
router.post('/2fa/verify', async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = z.object({
      tempToken: z.string(),
      code: z.string().min(6).max(8) // 6 for OTP, 8 for recovery code
    }).parse(req.body);

    // Decode temp token (contains user ID)
    const decoded = Buffer.from(tempToken, 'base64').toString();
    const [userId, timestamp] = decoded.split(':');

    // Check if temp token is expired (5 minutes)
    if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non trouvé ou 2FA non activé'
      });
    }

    let valid = false;

    // Check if it's a recovery code
    if (code.length === 9 && code.includes('-')) {
      const recoveryCodes = user.twoFactorRecoveryCodes ? JSON.parse(user.twoFactorRecoveryCodes) : [];
      const codeIndex = recoveryCodes.indexOf(code);
      if (codeIndex > -1) {
        valid = true;
        // Remove used recovery code
        recoveryCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: JSON.stringify(recoveryCodes) }
        });
      }
    } else if (user.twoFactorMethod === 'totp' && user.twoFactorSecret) {
      valid = verifyTOTP(user.twoFactorSecret, code);
    } else if (user.twoFactorMethod === 'sms' && user.twoFactorOTP && user.twoFactorOTPExpiry) {
      if (user.twoFactorOTP === code && new Date() < user.twoFactorOTPExpiry) {
        valid = true;
      }
    }

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }

    // Generate final token
    const token = generateToken({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      companyId: user.companyId
    });

    // Clear OTP if used
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorOTP: null,
        twoFactorOTPExpiry: null,
        dernierLogin: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          company: user.company
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('2FA verify error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/2fa/resend - Resend SMS OTP
router.post('/2fa/resend', async (req: Request, res: Response) => {
  try {
    const { tempToken } = z.object({
      tempToken: z.string()
    }).parse(req.body);

    const decoded = Buffer.from(tempToken, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.telephone) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorOTP: otp,
        twoFactorOTPExpiry: otpExpiry,
      }
    });

    // TODO: Send SMS via gateway

    res.json({
      success: true,
      message: 'Nouveau code envoyé',
      data: {
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    console.error('2FA resend error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/2fa/disable - Disable 2FA
router.post('/2fa/disable', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password } = z.object({
      password: z.string().min(1)
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        twoFactorOTP: null,
        twoFactorOTPExpiry: null,
        twoFactorRecoveryCodes: null,
      }
    });

    res.json({
      success: true,
      message: 'Authentification à deux facteurs désactivée'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// PASSWORD RESET
// ============================================================

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({
      email: z.string().email()
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    res.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      data: process.env.NODE_ENV === 'development' ? { resetToken } : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(6)
    }).parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// EMAIL VERIFICATION
// ============================================================

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = z.object({
      token: z.string()
    }).parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifie: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      }
    });

    res.json({
      success: true,
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.emailVerifie) {
      return res.status(400).json({
        success: false,
        message: 'Email déjà vérifié'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry
      }
    });

    // TODO: Send verification email

    res.json({
      success: true,
      message: 'Email de vérification envoyé'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;

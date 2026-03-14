# GuinéaManager - Work Log

---
Task ID: 1
Agent: Super Z (Main)
Task: Build complete GuinéaManager ERP frontend

Work Log:
- Reviewed existing frontend structure and components
- All shadcn/ui components already installed (60+ components)
- All pages implemented: Dashboard, Clients, Produits, Factures, Employés, Paie, Dépenses, Rapports, Settings
- Layout components (Sidebar, Header) implemented with navigation
- Auth store with Zustand and persistence configured
- Mock data with Guinean context (GNF currency, Guinean names and locations)
- Payroll calculations with CNSS (5% employee, 18% employer) and IPR (progressive tax brackets)
- Fixed lint error: removed unnecessary loading state in useEffect
- Updated metadata for GuinéaManager branding

Stage Summary:
- Frontend is complete and functional
- All pages implement CRUD operations with dialogs
- Charts and analytics using Recharts library
- French language UI throughout
- GNF currency formatting
- Demo login (any email/password works)
- ESLint passes with no errors

## Project Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Main page with routing
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx     # Navigation sidebar
│   │   │   └── header.tsx      # Page header
│   │   ├── pages/
│   │   │   ├── login-page.tsx
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── clients-page.tsx
│   │   │   ├── produits-page.tsx
│   │   │   ├── factures-page.tsx
│   │   │   ├── employes-page.tsx
│   │   │   ├── paie-page.tsx
│   │   │   ├── depenses-page.tsx
│   │   │   ├── rapports-page.tsx
│   │   │   └── settings-page.tsx
│   │   └── ui/                 # 60+ shadcn/ui components
│   ├── stores/
│   │   └── auth-store.ts       # Zustand store with persistence
│   ├── lib/
│   │   ├── mock-data.ts        # Mock data and utility functions
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── index.ts            # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## Key Features

1. **Authentication**: Demo login (any credentials work)
2. **Dashboard**: Stats cards, recent invoices, stock alerts, employee overview
3. **Clients**: CRUD with type (Particulier/Entreprise), search, filters
4. **Produits**: CRUD with stock tracking, categories, low stock alerts
5. **Factures**: CRUD with TVA calculation, status management, payment modes
6. **Employés**: CRUD with departments, contract types (CDI, CDD, etc.)
7. **Paie**: Bulletin creation with automatic CNSS/IPR calculations
8. **Dépenses**: CRUD with categories, payment modes, monthly filtering
9. **Rapports**: Charts (bar, line, pie), KPIs, monthly summary table
10. **Settings**: Company info, profile, security, notifications, appearance

## Guinean Payroll Calculations

- **CNSS Employee**: 5% of base (capped at 5M GNF)
- **CNSS Employer**: 18% of base (capped at 5M GNF)
- **IPR (Income Tax)**:
  - 0-3M GNF: 0%
  - 3-5M GNF: 10%
  - 5-10M GNF: 15% + 200,000 GNF
  - >10M GNF: 20% + 950,000 GNF

declare module 'africastalking' {
  interface AfricaStalkingOptions {
    apiKey: string;
    username: string;
    format?: 'json' | 'xml';
  }

  interface SMSMessage {
    to: string | string[];
    message: string;
    from?: string;
    enqueue?: boolean;
  }

  interface SMSResponse {
    SMSMessageData: {
      Message: string;
      Recipients: Array<{
        statusCode: number;
        number: string;
        status: string;
        cost: string;
        messageId: string;
      }>;
    };
  }

  interface SMSService {
    send(message: SMSMessage): Promise<SMSResponse>;
  }

  interface AfricaStalking {
    SMS: SMSService;
  }

  function AfricaStalking(options: AfricaStalkingOptions): AfricaStalking;
  export = AfricaStalking;
}

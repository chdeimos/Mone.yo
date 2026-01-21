
import prisma from "./prisma";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogOptions {
    level?: LogLevel;
    message: string;
    stack?: string;
    context?: any;
}

export const logger = {
    async info(message: string, context?: any) {
        return this.log({ level: "INFO", message, context });
    },

    async warn(message: string, context?: any) {
        return this.log({ level: "WARN", message, context });
    },

    async error(message: string, error?: any, context?: any) {
        return this.log({
            level: "ERROR",
            message,
            stack: error instanceof Error ? error.stack : (typeof error === 'string' ? error : undefined),
            context: context || (error instanceof Error ? { name: error.name } : undefined)
        });
    },

    async log(options: LogOptions) {
        try {
            const { level = "INFO", message, stack, context } = options;

            // Console output as fallback/development visibility
            if (level === "ERROR") {
                console.error(`[${level}] ${message}`, stack || "");
            } else {
                console.log(`[${level}] ${message}`);
            }

            // Save to database
            return await prisma.systemLog.create({
                data: {
                    level,
                    message,
                    stack,
                    context: context ? JSON.stringify(context) : null,
                },
            });
        } catch (err) {
            console.error("Critical error in logger:", err);
        }
    }
};

export const accessLogger = {
    async log(options: {
        email?: string;
        action: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "2FA_VERIFY";
        ip?: string;
        userAgent?: string;
    }) {
        try {
            return await prisma.accessLog.create({
                data: {
                    email: options.email,
                    action: options.action,
                    ip: options.ip,
                    userAgent: options.userAgent,
                },
            });
        } catch (err) {
            console.error("Critical error in accessLogger:", err);
        }
    }
};

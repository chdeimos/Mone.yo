import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
});

const dayMonthFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
});

const monthYearFormatter = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

const shortTimeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
});

export function formatCurrency(amount: number | string) {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return currencyFormatter.format(val);
}

export function formatDate(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return dateFormatter.format(d);
}

export function formatShortDate(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return shortDateFormatter.format(d);
}

export function formatDayMonth(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return dayMonthFormatter.format(d);
}

export function formatMonthYear(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return monthYearFormatter.format(d);
}

export function formatDateTime(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return dateTimeFormatter.format(d);
}

export function formatTime(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return timeFormatter.format(d);
}

export function formatShortTime(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return shortTimeFormatter.format(d);
}

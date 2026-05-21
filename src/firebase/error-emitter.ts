'use client';

type ErrorEvents = {
  'permission-error': (error: any) => void;
};

class ErrorEmitter {
  private listeners: { [K in keyof ErrorEvents]?: ErrorEvents[K][] } = {};

  on<K extends keyof ErrorEvents>(event: K, listener: ErrorEvents[K]) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(listener);
  }

  emit<K extends keyof ErrorEvents>(event: K, ...args: Parameters<ErrorEvents[K]>) {
    this.listeners[event]?.forEach((listener) => (listener as (...a: typeof args) => void)(...args));
  }
}

export const errorEmitter = new ErrorEmitter();

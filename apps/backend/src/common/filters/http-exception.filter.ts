import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const details = normalizeExceptionResponse(exceptionResponse, status);
    const body: ErrorResponseBody = {
      statusCode: status,
      message: details.message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl
    };

    if (details.errors) {
      body.errors = details.errors;
    }

    response.status(status).json(body);
  }
}

function normalizeExceptionResponse(
  response: string | object | undefined,
  status: number
): { message: string; errors?: Record<string, string[]> } {
  if (typeof response === 'string') {
    return { message: response };
  }

  if (response && 'message' in response) {
    const messageValue = response.message;
    const message =
      typeof messageValue === 'string'
        ? messageValue
        : Array.isArray(messageValue)
          ? messageValue.filter(isString).join(', ')
          : defaultMessage(status);
    const errors =
      'errors' in response && isErrorMap(response.errors)
        ? response.errors
        : undefined;

    return errors ? { message, errors } : { message };
  }

  return { message: defaultMessage(status) };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isErrorMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      (messages) => Array.isArray(messages) && messages.every(isString)
    )
  );
}

function defaultMessage(status: number): string {
  return status === HttpStatus.INTERNAL_SERVER_ERROR
    ? 'Errore interno del server'
    : 'Richiesta non valida';
}

import { Dispatch } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

export type ServerError = {
  messages: string | string[];
  key?: string;
};

export interface IErrorBase {
  error: Error | AxiosError<ServerError>;
}

export const axiosErrorHandler = (err: IErrorBase | unknown, dispatch: Dispatch): void => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<ServerError>;
    console.error(`Request Error: ${axiosError.response?.data.messages as string}`);
  } else {
    const error = err as Error;
    console.error(`Error: ${error.message as string}`);
  }
};

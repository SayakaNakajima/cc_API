import express, { Application } from "express";
import { Middleware, ErrorHandlingMiddleware } from "./middleware/types";
import BaseController from "./services/common/controller";
import bodyParser from "body-parser";
import loggerMiddleware from "./middleware/logger";
import GlyphController from "./services/glyphs/controller";
import errorHandler from "./middleware/errorHandler";


interface AppConfig {
  appSecret: string;
  services: BaseController[];
  port?: number;
  middleware?: Middleware[];
  errorHandlers?: ErrorHandlingMiddleware[];
}

class App {
  /* Constants, default config */
  public static readonly DEFAULT_PORT: number = 9000;

  /* Instance properties */
  public readonly app: Application;
  public readonly port: number;
  public readonly appSecret: string;

  protected postStartHook: () => void;

  constructor({ appSecret, port, middleware, services, errorHandlers }: AppConfig) {
    this.appSecret = appSecret;

    this.app = express();
    this.app.set("APP_SECRET", this.appSecret);

    this.port = port || App.DEFAULT_PORT;

    this.registerMiddleware(middleware);
    this.registerServices(services);

    // Error handler must be added after routes and middleware
    this.registerErrorHandlers(errorHandlers);

    this.postStartHook = () => {
      console.log(`App listening on localhost:${this.port}`);
    };
  }

  public start(): void {
    this.app.listen(/* Port number */ this.port, /* Callback */ this.postStartHook);
  }

  /**
   * Register middleware with our Express app
   */
  protected registerMiddleware(middleware: (Middleware | ErrorHandlingMiddleware)[]): void {
    middleware.forEach((_middleware) => this.app.use(_middleware));
  }

  /**
   * Register services with our Express app
   */
  protected registerServices(services: BaseController[]): void {
    services.forEach((_service) => this.app.use(_service.path, _service.router));
  }

  /**
   * Register error handlers with our Express app
   */
  protected registerErrorHandlers(errorHandlers: ErrorHandlingMiddleware[]): void {
    errorHandlers.forEach((_errorHandler) => this.app.use(errorHandlers));
  }
}

/**
 * A factory function that returns an instance
 * of App with default configurations
 */
export function getDefaultApp(appSecret: string) {
  return new App({
    appSecret,
    port: 5000,
    middleware: [
      /* Body Parser, see: https://stackoverflow.com/questions/38306569/what-does-body-parser-do-with-express */
      bodyParser.json(),
      bodyParser.urlencoded({ extended: true }),
      /* Log incoming requests */
      loggerMiddleware,
    ],
    services: [
      /* Where we register our services */
      new GlyphController(),
    ],
    errorHandlers: [
      /* Handle errors */
      errorHandler
    ]
  });
}

export default App;

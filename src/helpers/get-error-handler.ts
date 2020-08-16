import type { Logger } from "pino";
import { WebhookError } from "@octokit/webhooks";

export function getErrorHandler(logger: Logger) {
  return (error: Error) => {
    const errors = (error.name === "AggregateError"
      ? error
      : [error]) as WebhookError[];

    for (const error of errors) {
      const errMessage = (error.message || "").toLowerCase();

      if (errMessage.includes("x-hub-signature")) {
        logger.error(
          error,
          "Go to https://github.com/settings/apps/YOUR_APP and verify that the Webhook secret matches the value of the WEBHOOK_SECRET environment variable."
        );
        continue;
      }

      if (errMessage.includes("pem") || errMessage.includes("json web token")) {
        logger.error(
          error,
          "Your private key (usually a .pem file) is not correct. Go to https://github.com/settings/apps/YOUR_APP and generate a new PEM file. If you're deploying to Now, visit https://probot.github.io/docs/deployment/#now."
        );
        continue;
      }

      const log = logger.child({
        name: "event",
        id: error.event ? error.event.id : undefined,
      });
      log.error(error);
    }
  };
}

import Fastify from "fastify";
import env from "./config/env.js";
import logger from "./config/logger.js";

const fastify = Fastify({
    logger: logger,
});

fastify.get("/", function handler(request, reply) {
    return { message: "Blog app demo" };
});

fastify.listen({ port: env.port }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Blog App is running in ${env.nodeEnv} mode at ${address}`);
});

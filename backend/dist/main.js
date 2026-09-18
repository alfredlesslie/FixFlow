"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('FixFlowBootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    app.enableCors({
        origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api', {
        exclude: ['graphql'],
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`FixFlow Backend is running on: http://localhost:${port}`);
    logger.log(`GraphQL Playground ready at: http://localhost:${port}/graphql`);
    logger.log(`REST Health endpoint: http://localhost:${port}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map
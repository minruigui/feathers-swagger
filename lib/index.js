const OpenApiV2Generator = require('./v2/generator');
const OpenApiV3Generator = require('./v3/generator');
const utils = require('./utils');
const swaggerUI = require('./swagger-ui-dist');
const { customMethod, customMethodsHandler } = require('./custom-methods');
const { isExpressApp, isKoaApp } = require('./helpers');

const init = module.exports = function (config) {
  return function () {
    const app = this;
    const {
      ui,
      docsJsonPath = '/swagger.json',
      appProperty = 'docs',
      openApiVersion = 3,
      LINKS
    } = config;

    const specs = {};
    if (appProperty) {
      app[appProperty] = specs;
    }

    if (isExpressApp(app)) {
      app.get(docsJsonPath, (req, res) => {
        res.json(specs);
      });
    } else if (isKoaApp(app)) {
      app.use(async (ctx, next) => {
        if (ctx.url === docsJsonPath) {
          ctx.body = specs;
        }
        return next();
      });
    }

    let specGenerator;
    if (openApiVersion === 2) {
      specGenerator = new OpenApiV2Generator(app, specs, config);
    } else if (openApiVersion === 3) {
      specGenerator = new OpenApiV3Generator(app, specs, config);
    } else {
      throw new Error(`Unsupported openApiVersion ${openApiVersion}! Allowed: 2, 3`);
    }

    // Register this plugin
    /* istanbul ignore else for feathers versions < 3 */
    if ((app.version && parseInt(app.version, 10) >= 3) || Array.isArray(app.mixins)) {
      app.mixins.push(specGenerator.addService);
    } else {
      app.providers.push((path, service) => specGenerator.addService(service, path));
    }

    // init UI module
    if (ui) {
      ui(app, { docsJsonPath, specs, openApiVersion,LINKS});
    }
  };
};

Object.assign(init, utils);
init.swaggerUI = swaggerUI;
init.customMethod = customMethod;
init.customMethodsHandler = customMethodsHandler;

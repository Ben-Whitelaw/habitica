import { authWithHeaders } from '../../middlewares/auth';
import { model as Webhook } from '../../models/webhook';
import { removeFromArray } from '../../libs/collectionManipulators';
import { NotFound } from '../../libs/errors';

let api = {};

/**
* @api {post} /api/v3/user/webhook Create a new webhook - BETA
* @apiName UserAddWebhook
* @apiGroup Webhook
*
* @apiParam {UUID} [id="Randomly Generated UUID"] Body parameter - The webhook's id
* @apiParam {String} url Body parameter - The webhook's URL
* @apiParam {Boolean} [enabled=true] Body parameter - If the webhook should be enabled
* @apiParam {Sring="taskActivity","groupChatReceived"} [type="taskActivity"] Body parameter - The webhook's type.
* @apiParam {Object} [options] Body parameter - The webhook's options. Wil differ depending on type. Required for `groupChatReceived` type. If a webhook supports options, the dfault values are displayed in the examples below
* @apiParamExample {json} Basic Example (Task Scored)
*   {
*     "enabled": true,
*     "url": "http://some-webhook-url.com"
*   }
* @apiParamExample {json} Task Scored With Specified Id Example
*   {
*     "id": "a-valid-uuid-goes-here",
*     "enabled": true,
*     "url": "http://some-webhook-url.com",
*     "type": "taskActivity"
*   }
* @apiParamExample {json} Task Activity Example
*   {
*     "enabled": true,
*     "url": "http://some-webhook-url.com",
*     "type": "taskActivity",
*     "options": {
*       "created": false,
*       "updated": false,
*       "deleted": false,
*       "scored": true
*     }
*   }
* @apiParamExample {json} Group Chat Received Example
*   {
*     "enabled": true,
*     "url": "http://some-webhook-url.com",
*     "type": "groupChatReceived",
*     "options": {
*       "groupId": "required-uuid-of-group"
*     }
*   }
*
* @apiSuccess {Object} data The created webhook
* @apiSuccess {UUID} data.id The uuid of the webhook
* @apiSuccess {String} data.url The url of the webhook
* @apiSuccess {Boolean} data.enabled Whether the webhook should be sent
* @apiSuccess {String} data.type The type of the webhook
* @apiSuccess {Object} data.options The options for the webhook (See examples)
*
* @apiError InvalidUUID The `id` was not a valid `UUID`
* @apiError InvalidEnable The `enable` param was not a `Boolean` value
* @apiError InvalidUrl The `url` param was not valid url
* @apiError InvalidWebhookType The `type` param was not a supported Webhook type
* @apiError GroupIdIsNotUUID The `options.groupId` param is not a valid UUID for groupChatReceived webhook type
*/
api.addWebhook = {
  method: 'POST',
  middlewares: [authWithHeaders()],
  url: '/user/webhook',
  async handler (req, res) {
    let user = res.locals.user;
    let webhook = new Webhook(req.body);

    await webhook.validate();

    webhook.formatOptions(res);

    user.webhooks.push(webhook);

    await user.save();

    res.respond(201, webhook);
  },
};

/**
* @api {put} /api/v3/user/webhook/:id Edit a webhook - BETA
* @apiName UserUpdateWebhook
* @apiGroup Webhook
* @apiDescription Can change `url`, `enabled`, `type`, and `options` properties. Cannot change `id`.
*
* @apiParam {UUID} id URL parameter - The id of the webhook to update
* @apiParam {String} [url] Body parameter - The webhook's URL
* @apiParam {Boolean} [enabled] Body parameter - If the webhook should be enabled
* @apiParam {Sring="taskActivity","groupChatReceived"} [type] Body parameter - The webhook's type.
* @apiParam {Object} [options] Body parameter - The webhook's options. Wil differ depending on type. The options are enumerated in the [add webhook examples](#api-Webhook-UserAddWebhook).
* @apiParamExample {json} Update Enabled and Type Properties
*   {
*     "enabled": false,
*     "type": "taskActivity"
*   }
* @apiParamExample {json} Update Group Id for Group Chat Receieved Webhook
*   {
*     "options": {
*       "groupId": "new-uuid-of-group"
*     }
*   }
*
* @apiSuccess {Object} data The updated webhook
* @apiSuccess {UUID} data.id The uuid of the webhook
* @apiSuccess {String} data.url The url of the webhook
* @apiSuccess {Boolean} data.enabled Whether the webhook should be sent
* @apiSuccess {String} data.type The type of the webhook
* @apiSuccess {Object} data.options The options for the webhook (See webhook add examples)
*
* @apiError WebhookDoesNotExist A webhook with that `id` does not exist
* @apiError InvalidEnable The `enable` param was not a `Boolean` value
* @apiError InvalidUrl The `url` param was not valid url
* @apiError InvalidWebhookType The `type` param was not a supported Webhook type
* @apiError GroupIdIsNotUUID The `options.groupId` param is not a valid UUID for groupChatReceived webhook type
*
*/
api.updateWebhook = {
  method: 'PUT',
  middlewares: [authWithHeaders()],
  url: '/user/webhook/:id',
  async handler (req, res) {
    let user = res.locals.user;
    let id = req.params.id;
    let webhook = user.webhooks.find(hook => hook.id === id);
    let { url, type, enabled, options } = req.body;

    if (!webhook) {
      throw new NotFound(res.t('noWebhookWithId', {id}));
    }

    if (url) {
      webhook.url = url;
    }

    if (type) {
      webhook.type = type;
    }

    if (enabled !== undefined) {
      webhook.enabled = enabled;
    }

    if (options) {
      webhook.options = Object.assign(webhook.options, options);
    }

    await webhook.validate();

    webhook.formatOptions(res);

    await user.save();
    res.respond(200, webhook);
  },
};

/**
* @api {delete} /api/v3/user/webhook/:id Delete a webhook - BETA
* @apiName UserDeleteWebhook
* @apiGroup Webhook
*
* @apiParam {UUID} id The id of the webhook to delete
*
* @apiSuccess {Object} data The remaining webhooks for the user
* @apiError WebhookDoesNotExist A webhook with that `id` does not exist
*/
api.deleteWebhook = {
  method: 'DELETE',
  middlewares: [authWithHeaders()],
  url: '/user/webhook/:id',
  async handler (req, res) {
    let user = res.locals.user;
    let id = req.params.id;

    let webhook = user.webhooks.find(hook => hook.id === id);

    if (!webhook) {
      throw new NotFound(res.t('noWebhookWithId', {id}));
    }

    removeFromArray(user.webhooks, webhook);

    await user.save();

    res.respond(200, user.webhooks);
  },
};

module.exports = api;

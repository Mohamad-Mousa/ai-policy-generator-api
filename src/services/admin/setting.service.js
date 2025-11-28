const BaseService = require("../core/base.service");
const CustomError = require("../core/custom_error.service");

class SettingService extends BaseService {
  constructor() {
    super();
    this.Setting = this.models.Setting;
  }

  async findOne() {
    const setting = await this.Setting.findOne({});
    return { setting };
  }

  async update(body) {
    const updatePayload = {};

    if (body.contact) {
      const contactUpdate = {};
      if (body.contact.email !== undefined) {
        contactUpdate.email = body.contact.email;
      }
      if (body.contact.phone !== undefined) {
        contactUpdate.phone = body.contact.phone;
      }
      if (Object.keys(contactUpdate).length > 0) {
        updatePayload.contact = contactUpdate;
      }
    }

    if (body.subscriptions) {
      const subscriptionUpdate = {};
      if (body.subscriptions.notifications !== undefined) {
        subscriptionUpdate.notifications = body.subscriptions.notifications;
      }
      if (body.subscriptions.emails !== undefined) {
        subscriptionUpdate.emails = body.subscriptions.emails;
      }
      if (Object.keys(subscriptionUpdate).length > 0) {
        updatePayload.subscriptions = subscriptionUpdate;
      }
    }

    if (body.privacyPolicy !== undefined) {
      updatePayload.privacyPolicy = body.privacyPolicy;
    }

    if (body.termsAndConditions !== undefined) {
      updatePayload.termsAndConditions = body.termsAndConditions;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new CustomError("No settings fields provided", 400);
    }

    const setting = await this.Setting.findOneAndUpdate({}, updatePayload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    return { setting };
  }
}

module.exports = SettingService;

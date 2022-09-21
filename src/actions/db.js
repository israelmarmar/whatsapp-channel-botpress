const _ = require("lodash");

class WDb {
  constructor(bp) {
    this.bp = bp;
    this.knex = bp.database;
  }

  async createUserMapping(botId, user_wid, user_id) {
    const mapping = { botId, user_wid, user_id };

    try {
      await this.knex("w_user").insert(mapping);

      return mapping;
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while creating a user mapping.",
        err
      );

      return undefined;
    }
  }

  async createFile(file_uuid, file_base64, user_wid) {
    const mapping = { file_uuid, file_base64, user_wid };

    try {
      await this.knex("w_file_base64").insert(mapping);

      return mapping;
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while creating a file mapping.",
        err
      );

      return undefined;
    }
  }

  async getUser(botId, user_wid) {
    try {
      const rows = await this.knex("w_user").where({ botId, user_wid });

      return rows[0];
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while fetching a user mapping.",
        err
      );

      return undefined;
    }
  }

  async getFile(file_uuid) {
    try {
      const rows = await this.knex("w_file_base64").where({ file_uuid });
      return rows[0];
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while fetching a visitor mapping.",
        err
      );
      return undefined;
    }
  }

  async delFile(file_uuid) {
    try {
      await this.knex("w_file_base64").where({ file_uuid }).del();
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while deleting a file mapping.",
        err
      );
      return undefined;
    }
  }
}

module.exports = WDb;

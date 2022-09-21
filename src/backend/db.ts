import * as sdk from "botpress/sdk";
import _ from "lodash";

export default class WDb {
  private knex: sdk.KnexExtended;
  private bp: typeof sdk;

  constructor(bp: typeof sdk) {
    this.bp = bp;
    this.knex = bp.database;
  }
  async initialize() {
    await this.knex.raw(`DROP TABLE IF EXISTS w_file_base64 CASCADE`)
    await this.knex.raw(`DROP TABLE IF EXISTS w_user CASCADE`)

    await this.knex.createTableIfNotExists("w_user", (table) => {
      table.string("botId");
      table.string("user_wid").unique();
      table.uuid("user_id").unique();
      table.primary(["botId", "user_wid"]);
    });

    await this.knex.createTableIfNotExists("w_file_base64", function (table) {
        table.string("file_uuid").unique();
        table.text("file_base64");
        table.string("user_wid");
        table.primary(["file_uuid"]);
        table.foreign("user_wid").references("w_user.user_wid");
        table.timestamps();
      });
  }

  async createUserMapping(
    botId: string,
    user_wid: string,
    user_id: string
  ): Promise<UserMapping> {
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

  async createFile(
    file_uuid: string,
    file_base64: string,
    user_wid: string
  ): Promise<File> {
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

  async getUser(botId: string, user_wid: string): Promise<UserMapping> {
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

  async getFile(
    file_uuid: string
  ): Promise<File | undefined> {
    try {
      const rows = await this.knex("w_file_base64").where({ file_uuid });
      return rows[0];
    } catch (err) {
      this.bp.logger.error(
        "An error occurred while fetching a file mapping.",
        err
      );
      return undefined;
    }
  }
}

export interface UserMapping {
  botId: string;
  user_wid: string;
  user_id: string;
}

export interface File {
  file_uuid: string;
  file_base64: string;
  user_wid: string;
}

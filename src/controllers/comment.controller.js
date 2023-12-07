"use strict";

const { SuccessResponse } = require("../core/success.response");
const {} = require("../services/comment.service");

class CommentController {
  createComment = async (req, res) => {
    new SuccessResponse({
      message: "create new comment",
      metadata: await this.createComment(req.body),
    }).send(res);
  };
}

module.exports = new CommentController();

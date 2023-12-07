"use strict";

const { getSelectData, unGetSelectData } = require("../../utils");

const findAllDiscountCodeUnSelect = async ({
  limit = 50,
  page = 1,
  sort = "ctime",
  filter,
  unSelect,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(unGetSelectData(unSelect))
    .lean();

  return documents;
};

const findAllDiscountCodeSelect = async ({
  limit = 50,
  page = 1,
  sort = "ctime",
  filter,
  select,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return documents;
};

const checkDiscountExits = async ({ model, filter }) => {
  return await model.findOne(filter).lean();
};

const checkDiscountCodeHasExpried = (start_date, end_date) => {
  if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
    throw new BadRequestError("Discount code has expried!");
  }
};

module.exports = {
  findAllDiscountCodeUnSelect,
  findAllDiscountCodeSelect,
  checkDiscountExits,
  checkDiscountCodeHasExpried,
};

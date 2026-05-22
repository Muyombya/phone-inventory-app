const Phone = require("../models/Phone");

const getPhones = async (req, res) => {
  try {
    const phones = await Phone.find();

    res.status(200).json(phones);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getPhoneById = async (req, res) => {
  try {
    const phone = await Phone.findById(
      req.params.id
    );

    if (!phone) {
      return res.status(404).json({
        message: "Phone not found",
      });
    }

    res.status(200).json(phone);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createPhone = async (req, res) => {
  try {
    const phone = await Phone.create(req.body);

    res.status(201).json(phone);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updatePhone = async (req, res) => {
  try {
    const phone =
      await Phone.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!phone) {
      return res.status(404).json({
        message: "Phone not found",
      });
    }

    res.status(200).json(phone);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deletePhone = async (req, res) => {
  try {
    const phone = await Phone.findByIdAndDelete(
      req.params.id
    );

    if (!phone) {
      return res.status(404).json({
        message: "Phone not found",
      });
    }

    res.status(200).json({
      message: "Phone deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getPhones,
  getPhoneById,
  createPhone,
  updatePhone,
  deletePhone,
};
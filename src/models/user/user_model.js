const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { user_type } = require("@enums");
const { user_validation_messages } = require("@validators/messages");
const {
  PASSWORD_SALT_ROUNDS,
  user_validation_limits,
  user_validation_patterns,
} = require("@validators/constants");

// Passwords are selected only for authentication and are removed from
// serialized output by the schema's toJSON transform below.
const user_schema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, user_validation_messages.FIRST_NAME_REQUIRED],
      trim: true,
      minlength: [
        user_validation_limits.FIRST_NAME_MIN,
        user_validation_messages.FIRST_NAME_MIN,
      ],
      maxlength: [
        user_validation_limits.FIRST_NAME_MAX,
        user_validation_messages.FIRST_NAME_MAX,
      ],
    },
    last_name: {
      type: String,
      required: [true, user_validation_messages.LAST_NAME_REQUIRED],
      trim: true,
      minlength: [
        user_validation_limits.LAST_NAME_MIN,
        user_validation_messages.LAST_NAME_MIN,
      ],
      maxlength: [
        user_validation_limits.LAST_NAME_MAX,
        user_validation_messages.LAST_NAME_MAX,
      ],
    },
    email: {
      type: String,
      required: [true, user_validation_messages.EMAIL_REQUIRED],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [
        user_validation_limits.EMAIL_MIN,
        user_validation_messages.EMAIL_MIN,
      ],
      maxlength: [
        user_validation_limits.EMAIL_MAX,
        user_validation_messages.EMAIL_MAX,
      ],
      match: [
        user_validation_patterns.EMAIL,
        user_validation_messages.EMAIL_INVALID,
      ],
      index: true,
    },
    phone_number: {
      type: String,
      required: [true, user_validation_messages.PHONE_NUMBER_REQUIRED],
      unique: true,
      trim: true,
      minlength: [
        user_validation_limits.PHONE_NUMBER_MIN,
        user_validation_messages.PHONE_NUMBER_MIN,
      ],
      maxlength: [
        user_validation_limits.PHONE_NUMBER_MAX,
        user_validation_messages.PHONE_NUMBER_MAX,
      ],
      match: [
        user_validation_patterns.PHONE_NUMBER,
        user_validation_messages.PHONE_NUMBER_INVALID,
      ],
      index: true,
    },
    emp_id: {
      type: String,
      required: [true, user_validation_messages.EMP_ID_REQUIRED],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        user_validation_limits.EMP_ID_MIN,
        user_validation_messages.EMP_ID_MIN,
      ],
      maxlength: [
        user_validation_limits.EMP_ID_MAX,
        user_validation_messages.EMP_ID_MAX,
      ],
      match: [
        user_validation_patterns.EMP_ID,
        user_validation_messages.EMP_ID_INVALID,
      ],
      index: true,
    },
    username: {
      type: String,
      required: [true, user_validation_messages.USERNAME_REQUIRED],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [
        user_validation_limits.USERNAME_MIN,
        user_validation_messages.USERNAME_MIN,
      ],
      maxlength: [
        user_validation_limits.USERNAME_MAX,
        user_validation_messages.USERNAME_MAX,
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, user_validation_messages.PASSWORD_REQUIRED],
      minlength: [
        user_validation_limits.PASSWORD_MIN,
        user_validation_messages.PASSWORD_MIN,
      ],
      maxlength: [
        user_validation_limits.PASSWORD_STORAGE_MAX,
        user_validation_messages.PASSWORD_STORAGE_MAX,
      ],
      select: false,
    },
    user_type: {
      type: String,
      required: [true, user_validation_messages.USER_TYPE_REQUIRED],
      default: user_type.EMPLOYEE,
      enum: {
        values: Object.values(user_type),
        message: user_validation_messages.USER_TYPE_INVALID,
      },
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: {
      flattenMaps: true,
      transform: (_document, result) => {
        delete result.password;
        return result;
      },
    },
    toObject: { flattenMaps: true },
  },
);

// Hash only new or changed passwords so reads and unrelated updates do not
// re-hash an already encoded value.
user_schema.pre("save", async function hash_password() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUNDS);
});

// Authentication controllers must select the hidden password before calling
// this method; a missing password cannot authenticate successfully.
user_schema.methods.compare_password = function compare_password(
  candidate_password,
) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidate_password, this.password);
};

module.exports = mongoose.model("User", user_schema);

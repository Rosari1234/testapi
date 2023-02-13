import { AppLogger } from "../common/logging";
import { ApplicationError } from "../common/application-error";
import { DUser, IUser, SignedUpAs, UserActivation, UserRole, UserStatus } from "../models/user-model";
import User from "../schemas/user-schema";
import { StringOrObjectId, Util } from "../common/util";
import { DAdmin, IAdmin } from "../models/admin-model";
import { DCustomerAdmin, ICustomerAdmin } from "../models/customerAdmin-model";
import { EmailService } from "../mail/config";

export namespace UserDao {
  export async function authenticateUser(email: string, password: string): Promise<string> {
    const user = await getUserByEmail(email);
    if (user) {
      const isMatch = await user.comparePassword(password);
      let verificationCode = null;
      if (!isMatch) {
        throw new ApplicationError("Incorrect email/password combination.");
      }
      if (user?.validationCode == UserActivation.INACTIVE) {
        throw new ApplicationError("Your account has been suspended. Please reach out to support at info@mydeal.com for further assistance.");
      }
      if (user?.adminApproved == false) {
        throw new ApplicationError("Your account has been created. Admin approval is required.");
      }
      if (user?.verifiedStatus == UserStatus.PENDING) {
        let code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

        verificationCode = code.toString();

        const updatedUser: any = {
          verificationCode: await Util.passwordHashing(verificationCode),
        };

        let userWithVerificationCode = await UserDao.updateUser(user._id, updatedUser);

        if (!userWithVerificationCode) {
          throw new ApplicationError("Something went wrong with verification code.");
        }

        await EmailService.sendVerifyEmail(
          user,
          "Pencil my deal - Verify your email.",
          verificationCode,
          "Thank you for signing up with Pencil my deal!",
          "To proceed with your account you have to verify your email. Please enter the following OTP in the verify section."
        );
      }
      return user.createAccessToken();
    } else {
      throw new ApplicationError("User not found in the system.");
    }
  }

  export async function getUserById(id: StringOrObjectId): Promise<IUser> {
    let user: IUser = await User.findById(id)
      .populate([
        { path: "profileImageId" },
      ])
      .select({ password: 0 });
    if (!user) {
      throw new ApplicationError("User not found for Id: " + id);
    }

    AppLogger.info(`Got user for id, userID: ${user._id}`);
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  export async function updateUser(id: StringOrObjectId, data: Partial<DUser>): Promise<IUser> {
    let user = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).select({ password: 0 }).populate([
      { path: "profileImageId" },
    ]);
    return user;
  }

  export async function getUserByEmail(email: string): Promise<IUser | ICustomerAdmin | null> {
    let user = await User.findOne(
      { email: email }
    );
    return user;
  }


  export async function signUpWithEmail(
    email: string,
    name: string,
    password: string,
    validationCode: string,
    role: string,

  ): Promise<IUser> {
    let isEmailUsed = await User.findOne({ email: email });
    if (isEmailUsed) {
      throw new ApplicationError("Provided email is already taken.");
    }
    let userDetails: DAdmin | DCustomerAdmin = null;

    if (role == UserRole.SUPER_ADMIN) {
      userDetails = {
        email: email,
        name: name,
        password: password,
        validationCode: validationCode,
        role: role,
      };
    }
    try {
      const user = new User(userDetails);
      const newUser = await user.save();
      return newUser;
    }
    catch (err) {
      console.log('errrr', err)
    }
  }

  export async function signupAdmin(data: DCustomerAdmin): Promise<IUser> {
    const customer = new User(data);
    let res = await customer.save();
    return res;
  }
}


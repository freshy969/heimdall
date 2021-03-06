import path from "path";
import * as AWSMock from "aws-sdk-mock";
import generate from "../../../lib/commands/generate";
import sendEmail from "../../../lib/utils/sendEmail";
import { domain, email } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/utils/sendEmail");

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore();
});

it("should store the alias-description record and send a response email for a successful outcome", async () => {
  const mockDocumentClient = jest.fn();

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "put",
    (params: any, callback: Callback) => {
      mockDocumentClient(params);
      callback(null, null);
    }
  );

  const testEmail = await generateTestEmail({
    to: [{ email: "test@domain.com" }],
    subject: "Some description"
  });

  await generate(testEmail);

  expect(mockDocumentClient.mock.calls.length).toBe(1);
  expect(mockDocumentClient.mock.calls[0][0].Item).toStrictEqual({
    alias: "fakeid",
    description: "Some description"
  });

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: `${Commands.Generate}@${domain}`,
    to: [email],
    subject: "Generated alias: fakeid",
    text: `You have generated fakeid@${domain} for "Some description".`
  });
});

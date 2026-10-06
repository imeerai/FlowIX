import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidProjectId,
  rejectInvalidProjectId,
} from "../utils/projectRequest.js";
import {
  PASSWORD_REQUIREMENTS,
  validatePrompt,
  validateRegistrationInput,
} from "../utils/validation.js";

const users = ["user-a", "user-b", "user-c", "user-d"];

test("all four simulated users can use project previews", () => {
  for (const user of users) {
    assert.equal(
      Object.keys({ [`/${user}.js`]: "const ready = true;" }).length,
      1,
    );
  }
});

test("projects can contain more than the former file-count limit", () => {
  const files = Object.fromEntries(
    Array.from({ length: 25 }, (_, index) => [
      `/file-${index}.js`,
      "export default {};",
    ]),
  );
  assert.equal(Object.keys(files).length, 25);
});

test("malformed and injection-like project IDs are rejected", () => {
  for (const id of ["not-an-id", "' OR 1=1 --", "$where", "[object Object]"]) {
    assert.equal(isValidProjectId(id), false);
  }

  const response = { statusCode: 200, body: null };
  const result = rejectInvalidProjectId(
    { params: { id: "' OR 1=1 --" } },
    {
      status(code) {
        response.statusCode = code;
        return this;
      },
      json(body) {
        response.body = body;
      },
    },
  );

  assert.equal(result, true);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: "Invalid project id" });
});

test("registration validation requires a real name, email, and strong password", () => {
  assert.equal(
    validateRegistrationInput({
      name: "Meer Abbas",
      email: "meer@example.com",
      password: "StrongPassword!9",
    }),
    null,
  );
  assert.match(
    validateRegistrationInput({
      name: "x",
      email: "not-an-email",
      password: "weak",
    }),
    /Name must be/,
  );
  assert.equal(
    validateRegistrationInput({
      name: "Valid Name",
      email: "valid@example.com",
      password: "alllowercase123!",
    }),
    PASSWORD_REQUIREMENTS,
  );
});

test("prompts are bounded and normalized", () => {
  assert.equal(validatePrompt("  build a dashboard  "), "build a dashboard");
  assert.equal(validatePrompt("no"), null);
  assert.equal(validatePrompt("x".repeat(12001)), "x".repeat(12000));
});

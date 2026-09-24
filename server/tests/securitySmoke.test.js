import assert from "node:assert/strict";
import test from "node:test";
import {
  getProjectLimitError,
  MAX_PROJECT_FILES,
  MAX_PROJECT_SOURCE_BYTES,
} from "../services/projectLimits.js";
import {
  isValidProjectId,
  rejectInvalidProjectId,
} from "../utils/projectRequest.js";

const users = ["user-a", "user-b", "user-c", "user-d"];

test("all four simulated users can use the shared preview limits", () => {
  for (const user of users) {
    assert.equal(
      getProjectLimitError({ [`/${user}.js`]: "const ready = true;" }),
      null,
    );
  }
});

test("preview limit is rejected before the runtime is reached", () => {
  const tooManyFiles = Object.fromEntries(
    Array.from({ length: MAX_PROJECT_FILES + 1 }, (_, index) => [
      `/file-${index}.js`,
      "export default {};",
    ]),
  );
  assert.match(getProjectLimitError(tooManyFiles), /24-file preview limit/);

  const tooMuchSource = { "/App.js": "x".repeat(MAX_PROJECT_SOURCE_BYTES + 1) };
  assert.match(getProjectLimitError(tooMuchSource), /120 KB source limit/);
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

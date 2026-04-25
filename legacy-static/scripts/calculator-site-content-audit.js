"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredFiles = [
  "calculator-site-content/README.md",
  "calculator-site-content/content/site.json",
  "calculator-site-content/content/modules.json",
  "calculator-site-content/content/faqs.json",
  "calculator-site-content/content/glossary.json",
  "calculator-site-content/content/workflows.json",
  "calculator-site-content/content/use-cases.json"
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing required file: ${relativePath}`);
}

const site = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/site.json"), "utf8")
);

const readme = fs.readFileSync(
  path.join(ROOT, "calculator-site-content/README.md"),
  "utf8"
);

[
  "projectName",
  "tagline",
  "shortDescription",
  "longDescription",
  "audience",
  "valueProposition",
  "tone",
  "highlights",
  "pageIntent"
].forEach((key) => {
  assert.ok(Object.prototype.hasOwnProperty.call(site, key), `site.json is missing key: ${key}`);
});

assert.ok(Array.isArray(site.audience), "site.json audience must be an array.");
assert.ok(Array.isArray(site.highlights), "site.json highlights must be an array.");
assert.ok(
  readme.includes("content-only") && readme.includes("no design guidance"),
  "README must explain that this package is content-only and contains no design guidance."
);

const modules = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/modules.json"), "utf8")
);
const faqs = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/faqs.json"), "utf8")
);
const glossary = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/glossary.json"), "utf8")
);
const workflows = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/workflows.json"), "utf8")
);
const useCases = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/use-cases.json"), "utf8")
);

assert.ok(Array.isArray(modules), "modules.json must be an array.");
assert.ok(Array.isArray(faqs) && faqs.length >= 6, "faqs.json must contain at least 6 items.");
assert.ok(Array.isArray(glossary) && glossary.length >= 8, "glossary.json must contain at least 8 terms.");
assert.ok(Array.isArray(workflows) && workflows.length >= 4, "workflows.json must contain at least 4 workflows.");
assert.ok(Array.isArray(useCases) && useCases.length >= 3, "use-cases.json must contain at least 3 use cases.");

const expectedModuleIds = [
  "machine-arithmetic",
  "error-analysis",
  "polynomial-methods",
  "root-finding"
];
assert.deepStrictEqual(
  modules.map((module) => module.id),
  expectedModuleIds,
  "modules.json must contain the expected module ids in order."
);

const expectedModuleKeys = [
  "id",
  "label",
  "title",
  "summary",
  "whatItDoes",
  "whyItMatters",
  "inputs",
  "outputs",
  "keyConcepts",
  "learnerOutcomes",
  "commonUseCases",
  "limitations",
  "notes"
];

function assertNonEmptyString(value, message) {
  assert.strictEqual(typeof value, "string", message);
  assert.ok(value.trim().length > 0, message);
}

function assertStringArray(value, message) {
  assert.ok(Array.isArray(value), message);
  assert.ok(value.length > 0, message);
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${message} (item ${index + 1})`);
  });
}

function assertObjectItem(value, message) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), message);
}

const allowedAudienceLabels = ["students", "instructors", "self-learners"];
const allowedAudienceSet = new Set(allowedAudienceLabels);

const expectedWorkflowIds = [
  "machine-arithmetic-check",
  "error-analysis-review",
  "polynomial-comparison",
  "root-finding-session"
];
const expectedWorkflowAudienceById = new Map([
  ["machine-arithmetic-check", "students"],
  ["error-analysis-review", "students"],
  ["polynomial-comparison", "students"],
  ["root-finding-session", "students"]
]);

const expectedUseCaseIds = ["students", "instructors", "self-learners"];
const expectedUseCaseAudienceById = new Map([
  ["students", "students"],
  ["instructors", "instructors"],
  ["self-learners", "self-learners"]
]);

const seenIds = new Set();
for (const [index, module] of modules.entries()) {
  assertObjectItem(module, `Module at index ${index} must be an object.`);

  const moduleKeys = Object.keys(module).sort();
  assert.deepStrictEqual(
    moduleKeys,
    expectedModuleKeys.slice().sort(),
    `Module ${module.id ?? index} must contain exactly the expected keys.`
  );

  assertNonEmptyString(module.id, `Module ${index + 1} id must be a non-empty string.`);
  assert.ok(!seenIds.has(module.id), `Duplicate module id found: ${module.id}`);
  seenIds.add(module.id);

  assertNonEmptyString(module.label, `Module ${module.id} label must be a non-empty string.`);
  assertNonEmptyString(module.title, `Module ${module.id} title must be a non-empty string.`);
  assertNonEmptyString(module.summary, `Module ${module.id} summary must be a non-empty string.`);
  assertNonEmptyString(module.whatItDoes, `Module ${module.id} whatItDoes must be a non-empty string.`);
  assertNonEmptyString(module.whyItMatters, `Module ${module.id} whyItMatters must be a non-empty string.`);
  assertStringArray(module.inputs, `Module ${module.id} inputs must be a non-empty array of strings.`);
  assertStringArray(module.outputs, `Module ${module.id} outputs must be a non-empty array of strings.`);
  assertStringArray(module.keyConcepts, `Module ${module.id} keyConcepts must be a non-empty array of strings.`);
  assertStringArray(module.learnerOutcomes, `Module ${module.id} learnerOutcomes must be a non-empty array of strings.`);
  assertStringArray(module.commonUseCases, `Module ${module.id} commonUseCases must be a non-empty array of strings.`);
  assertStringArray(module.limitations, `Module ${module.id} limitations must be a non-empty array of strings.`);
  assertStringArray(module.notes, `Module ${module.id} notes must be a non-empty array of strings.`);
}

const expectedFaqKeys = ["id", "question", "answer", "category"];
const seenFaqIds = new Set();
for (const faq of faqs) {
  assertObjectItem(faq, "FAQ items must be objects.");

  const faqKeys = Object.keys(faq).sort();
  assert.deepStrictEqual(
    faqKeys,
    expectedFaqKeys.slice().sort(),
    `FAQ item ${faq.id ?? "unknown"} must contain exactly the expected keys.`
  );

  assertNonEmptyString(faq.id, "FAQ id must be a non-empty string.");
  assert.ok(!seenFaqIds.has(faq.id), `Duplicate FAQ id found: ${faq.id}`);
  seenFaqIds.add(faq.id);
  assertNonEmptyString(faq.question, `FAQ ${faq.id} question must be a non-empty string.`);
  assertNonEmptyString(faq.answer, `FAQ ${faq.id} answer must be a non-empty string.`);
  assertNonEmptyString(faq.category, `FAQ ${faq.id} category must be a non-empty string.`);
}

const expectedGlossaryKeys = ["id", "term", "definition", "plainLanguage", "relatedTerms"];
const seenGlossaryIds = new Set();
for (const term of glossary) {
  assertObjectItem(term, "Glossary terms must be objects.");

  const termKeys = Object.keys(term).sort();
  assert.deepStrictEqual(
    termKeys,
    expectedGlossaryKeys.slice().sort(),
    `Glossary term ${term.id ?? "unknown"} must contain exactly the expected keys.`
  );

  assertNonEmptyString(term.id, "Glossary id must be a non-empty string.");
  assert.ok(!seenGlossaryIds.has(term.id), `Duplicate glossary id found: ${term.id}`);
  seenGlossaryIds.add(term.id);
  assertNonEmptyString(term.term, `Glossary ${term.id} term must be a non-empty string.`);
  assertNonEmptyString(term.definition, `Glossary ${term.id} definition must be a non-empty string.`);
  assertNonEmptyString(term.plainLanguage, `Glossary ${term.id} plainLanguage must be a non-empty string.`);
  assertStringArray(term.relatedTerms, `Glossary ${term.id} relatedTerms must be a non-empty array of strings.`);
}

const expectedWorkflowKeys = ["id", "title", "summary", "audience", "steps"];
const seenWorkflowIds = new Set();
assert.deepStrictEqual(
  workflows.map((workflow) => workflow.id),
  expectedWorkflowIds,
  "workflows.json must contain the expected workflow ids in order."
);
for (const [index, workflow] of workflows.entries()) {
  assertObjectItem(workflow, `Workflow at index ${index} must be an object.`);

  const workflowKeys = Object.keys(workflow).sort();
  assert.deepStrictEqual(
    workflowKeys,
    expectedWorkflowKeys.slice().sort(),
    `Workflow ${workflow.id ?? index} must contain exactly the expected keys.`
  );

  assertNonEmptyString(workflow.id, `Workflow ${index + 1} id must be a non-empty string.`);
  assert.strictEqual(
    workflow.id,
    expectedWorkflowIds[index],
    `Workflow ${index + 1} id must be ${expectedWorkflowIds[index]}.`
  );
  assert.ok(!seenWorkflowIds.has(workflow.id), `Duplicate workflow id found: ${workflow.id}`);
  seenWorkflowIds.add(workflow.id);
  assertNonEmptyString(workflow.title, `Workflow ${workflow.id} title must be a non-empty string.`);
  assertNonEmptyString(workflow.summary, `Workflow ${workflow.id} summary must be a non-empty string.`);
  assertNonEmptyString(workflow.audience, `Workflow ${workflow.id} audience must be a non-empty string.`);
  assert.ok(
    allowedAudienceSet.has(workflow.audience),
    `Workflow ${workflow.id} audience must be one of: ${allowedAudienceLabels.join(", ")}.`
  );
  assert.strictEqual(
    workflow.audience,
    expectedWorkflowAudienceById.get(workflow.id),
    `Workflow ${workflow.id} audience must be ${expectedWorkflowAudienceById.get(workflow.id)}.`
  );
  assert.ok(Array.isArray(workflow.steps), `Workflow ${workflow.id} steps must be an array.`);
  assert.strictEqual(workflow.steps.length, 3, `Workflow ${workflow.id} must contain exactly 3 steps.`);
  workflow.steps.forEach((step, stepIndex) => {
    assertObjectItem(step, `Workflow ${workflow.id} step ${stepIndex + 1} must be an object.`);
    assert.deepStrictEqual(
      Object.keys(step).sort(),
      ["description", "outcome", "title"],
      `Workflow ${workflow.id} step ${stepIndex + 1} must contain exactly title, description, and outcome.`
    );
    assertNonEmptyString(step.title, `Workflow ${workflow.id} step ${stepIndex + 1} title must be a non-empty string.`);
    assertNonEmptyString(step.description, `Workflow ${workflow.id} step ${stepIndex + 1} description must be a non-empty string.`);
    assertNonEmptyString(step.outcome, `Workflow ${workflow.id} step ${stepIndex + 1} outcome must be a non-empty string.`);
  });
}

const expectedUseCaseKeys = ["id", "audience", "title", "summary", "benefits", "situations"];
const seenUseCaseIds = new Set();
assert.deepStrictEqual(
  useCases.map((useCase) => useCase.id),
  expectedUseCaseIds,
  "use-cases.json must contain the expected use-case ids in order."
);
for (const [index, useCase] of useCases.entries()) {
  assertObjectItem(useCase, `Use case at index ${index} must be an object.`);

  const useCaseKeys = Object.keys(useCase).sort();
  assert.deepStrictEqual(
    useCaseKeys,
    expectedUseCaseKeys.slice().sort(),
    `Use case ${useCase.id ?? index} must contain exactly the expected keys.`
  );

  assertNonEmptyString(useCase.id, `Use case ${index + 1} id must be a non-empty string.`);
  assert.strictEqual(
    useCase.id,
    expectedUseCaseIds[index],
    `Use case ${index + 1} id must be ${expectedUseCaseIds[index]}.`
  );
  assert.ok(!seenUseCaseIds.has(useCase.id), `Duplicate use case id found: ${useCase.id}`);
  seenUseCaseIds.add(useCase.id);
  assertNonEmptyString(useCase.audience, `Use case ${useCase.id} audience must be a non-empty string.`);
  assert.ok(
    allowedAudienceSet.has(useCase.audience),
    `Use case ${useCase.id} audience must be one of: ${allowedAudienceLabels.join(", ")}.`
  );
  assert.strictEqual(
    useCase.audience,
    expectedUseCaseAudienceById.get(useCase.id),
    `Use case ${useCase.id} audience must be ${expectedUseCaseAudienceById.get(useCase.id)}.`
  );
  assertNonEmptyString(useCase.title, `Use case ${useCase.id} title must be a non-empty string.`);
  assertNonEmptyString(useCase.summary, `Use case ${useCase.id} summary must be a non-empty string.`);
  assertStringArray(useCase.benefits, `Use case ${useCase.id} benefits must be a non-empty array of strings.`);
  assertStringArray(useCase.situations, `Use case ${useCase.id} situations must be a non-empty array of strings.`);
}

console.log("Calculator site content presence audit passed.");

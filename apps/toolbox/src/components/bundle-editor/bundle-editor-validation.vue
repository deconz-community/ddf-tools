<script setup lang="ts">
import type { Bundle, ValidationError, ValidationResult } from "@deconz-community/ddf-bundler";
import { createValidator } from "@deconz-community/ddf-validator";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const props = defineProps<{
  bundle: ReturnType<typeof Bundle>;
  files: ReturnType<typeof Bundle>["data"]["files"];
  modelValue?: ValidationResult;
}>();

const emit = defineEmits<{
  "update:modelValue": [result: ValidationResult];
  change: [];
}>();

// The bundle is marked raw (not reactive), so the result is also exposed through v-model
const validation = useVModel(props, "modelValue", emit);

function computeValidation(): ValidationResult {
  const validator = createValidator();
  const ddfcFile = props.files.find((file) => file.type === "DDFC");

  if (!ddfcFile) {
    return {
      result: "error",
      version: validator.version,
      errors: [{ type: "simple", message: "No DDFC file found." }],
    };
  }

  const errors: ValidationError[] = [];
  const parseJSON = (file: { path: string; data: string }) => {
    try {
      return JSON.parse(file.data);
    } catch (caught) {
      errors.push({
        type: "simple",
        message: caught instanceof Error ? caught.message : String(caught),
        file: file.path,
      });
      return undefined;
    }
  };

  const ddfc = parseJSON(ddfcFile);
  const genericFiles = props.files
    .filter((file) => file.type === "JSON")
    .map((file) => ({ path: file.path, data: parseJSON(file) }));

  if (errors.length > 0) return { result: "error", version: validator.version, errors };

  if (ddfc?.ddfvalidate === false) return { result: "skipped", version: validator.version };

  const validationResult = validator.bulkValidate(genericFiles, [
    { path: ddfcFile.path, data: ddfc },
  ]);

  if (validationResult.length === 0) return { result: "success", version: validator.version };

  validationResult.forEach(({ path, error }) => {
    if (error instanceof ZodError) {
      fromZodError(error).details.forEach((detail) => {
        errors.push({
          type: "code",
          message: detail.message,
          file: path,
          path: detail.path.map((part) => (typeof part === "symbol" ? String(part) : part)),
        });
      });
    } else {
      errors.push({ type: "simple", message: error.toString(), file: path });
    }
  });

  return { result: "error", version: validator.version, errors };
}

function validate() {
  const result = computeValidation();
  props.bundle.data.validation = result;
  validation.value = result;
  emit("change");
}
</script>

<template>
  <v-btn class="ma-2" variant="tonal" @click="validate()"> Validate </v-btn>

  <v-alert
    v-if="validation?.result === 'success'"
    class="ma-2"
    type="success"
    title="Validation result"
    text="This bundle passed the validation."
  />

  <template v-else-if="validation?.result === 'error'">
    <v-alert
      class="ma-2"
      type="error"
      title="Validation result"
      :text="`${validation?.errors.length} errors found.`"
    />

    <template v-for="(error, index) in validation?.errors" :key="index">
      <v-card
        v-if="error.type === 'simple'"
        class="ma-2"
        variant="outlined"
        :title="error.file ? `File : ${error.file}` : undefined"
        :text="error.message"
      />
      <v-card
        v-if="error.type === 'code'"
        class="ma-2"
        variant="outlined"
        :title="`File : ${error.file}`"
        :text="`${error.message} at ${error.path.join('/')}`"
      />
    </template>
  </template>

  <v-alert
    v-else-if="validation?.result === 'skipped'"
    class="ma-2"
    type="warning"
    title="Validation result"
    text="This bundle was skipped from validation."
  />

  <v-alert
    v-else
    class="ma-2"
    type="info"
    title="Validation result"
    text="No validation has been run yet."
  />
</template>

const normalizeFieldType = (fieldType = "TEXT") => {
  const normalized = String(fieldType).toUpperCase();
  const allowed = ["TEXT", "DROPDOWN", "CHECKBOX", "FILE", "NUMBER", "DATE", "EMAIL", "PHONE"];
  return allowed.includes(normalized) ? normalized : "TEXT";
};

export const normalizeCustomFields = (fields = []) => {
  if (!Array.isArray(fields)) return [];

  return fields
    .map((field) => {
      const label = (field?.label || "").trim();
      if (!label) return null;

      const fieldType = normalizeFieldType(field?.fieldType || field?.type || "TEXT");
      const required = Boolean(field?.required);
      const options = fieldType === "DROPDOWN" && Array.isArray(field?.options)
        ? field.options.map((opt) => String(opt).trim()).filter(Boolean)
        : [];

      return { label, fieldType, required, options };
    })
    .filter(Boolean);
};

export const getEventCustomFields = (event = {}) => {
  const source = Array.isArray(event.customFields) && event.customFields.length > 0
    ? event.customFields
    : event.customFormFields || [];

  return normalizeCustomFields(source);
};

export const getLegacyCustomFormFields = (customFields = []) =>
  customFields.map((field) => ({
    label: field.label,
    type: field.fieldType,
    required: field.required,
    options: field.options || [],
  }));


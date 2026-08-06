export interface VariantValueForLabel {
  attributeValue?: {
    value: string;
    attribute?: { name: string } | null;
  } | null;
}

export function formatVariantLabel(values: VariantValueForLabel[] | null | undefined) {
  if (!values?.length) return null;

  const labels = values
    .map(({ attributeValue }) => {
      if (!attributeValue) return null;
      return attributeValue.attribute?.name
        ? `${attributeValue.attribute.name}: ${attributeValue.value}`
        : attributeValue.value;
    })
    .filter((label): label is string => Boolean(label));

  return labels.length ? labels.join(" / ") : null;
}

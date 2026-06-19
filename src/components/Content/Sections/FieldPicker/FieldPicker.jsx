import { BooleanPicker } from "./Pickers/booleanPicker";
import { SelectPicker } from "./Pickers/SelectPicker";
import { ListPicker } from "./Pickers/ListPicker";
import { IntPicker } from "./Pickers/IntPicker";
import { TextPicker } from "./Pickers/textPicker";

export function FieldPicker({
  currentFieldValue,
  fieldInfo,
  ChangeInSection,
  lang,
}) {
  const require = fieldInfo.nValues[0] > 0;

  if (typeof fieldInfo.typeLiteral === typeof true || fieldInfo.typeLiteral) {
    ChangeInSection((prev) => {
      const newState = typeof prev === "object" ? prev : JSON.parse(prev);
      newState[fieldInfo.id] = fieldInfo.typeLiteral;
      return JSON.stringify(newState);
    });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>{"fieldInfo.label[lang]"} :</div>
        <div style={{ fontSize: 16 }}>{fieldInfo.typeLiteral}</div>
      </div>
    );
  }
  if (fieldInfo.typeEnum) {
    // there only one resource to pick
    if (fieldInfo.nValues[1] === 1) {
      return (
        <SelectPicker
          setJsonSpec={ChangeInSection}
          fieldInfo={fieldInfo}
          require={require}
          lang={lang}
          currentFieldValue={currentFieldValue}
        />
      );
    }
  } else if (
    fieldInfo.id &&
    fieldInfo.id === "lhs" &&
    fieldInfo.nValues[1] &&
    fieldInfo.nValues[1] > 1
  ) {
    return (
      <ListPicker
        setJsonSpec={ChangeInSection}
        fieldInfo={fieldInfo}
        require={require}
        lang={lang}
        currentFieldValue={currentFieldValue}
      />
    );
  } else if (fieldInfo.typeName && fieldInfo.typeName === "boolean") {
    return (
      <BooleanPicker
        setJsonSpec={ChangeInSection}
        fieldInfo={fieldInfo}
        require={require}
        lang={lang}
        currentFieldValue={currentFieldValue}
      />
    );
  } else if (
    fieldInfo.typeName === "integer" ||
    fieldInfo.typeName === "number"
  ) {
    return (
      <IntPicker
        setJsonSpec={ChangeInSection}
        fieldInfo={fieldInfo}
        require={require}
        lang={lang}
        currentFieldValue={currentFieldValue}
      />
    );
  } else if (fieldInfo.typeName === "string") {
    return (
      <TextPicker
        setJsonSpec={ChangeInSection}
        fieldInfo={fieldInfo}
        require={require}
        lang={lang}
        currentFieldValue={currentFieldValue}
      />
    );
  } else {
    return <div>{fieldInfo.id} : picker not found</div>;
  }
}

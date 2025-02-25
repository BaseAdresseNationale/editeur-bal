import { useCallback, useState, useMemo } from "react";
import {
  Pane,
  Button,
  SelectMenu,
  Tooltip,
  TrashIcon,
  PropertyIcon,
} from "evergreen-ui";
import { capitalize } from "lodash";

import languesRegionales from "@ban-team/shared-data/langues-regionales.json";

import useFocus from "@/hooks/focus";

import AssistedTextField from "@/components/assisted-text-field";

interface LanguageFieldProps {
  initialValue: {
    code: string;
    value: string;
  };
  availableLanguages: Array<{ code: string; label: string }>;
  onChange: (value: { code: string; value: string }) => void;
  onDelete: (code: string) => void;
}

function LanguageField({
  initialValue,
  availableLanguages,
  onChange,
  onDelete,
}: LanguageFieldProps) {
  const [codeISO, setCodeISO] = useState(initialValue?.code);
  const [input, setInput] = useState(initialValue?.value || "");
  const [ref, setIsFocus] = useFocus();

  const languageLabel = useMemo(() => {
    if (codeISO) {
      return languesRegionales.find((language) => language.code === codeISO)
        ?.label;
    }
  }, [codeISO]);

  const handleLanguageCode = (codeISO) => {
    setCodeISO(codeISO);
    onChange({ code: codeISO, value: input });
    setIsFocus(true);
  };

  const handleLanguageChange = useCallback(
    (event) => {
      const { value } = event.target;

      setInput(value);
      onChange({ code: codeISO, value });
    },
    [codeISO, onChange]
  );

  return (
    <Pane
      width="100%"
      display="flex"
      flexDirection="column"
      marginBottom={18}
      marginTop="1em"
    >
      <SelectMenu
        title="Choisir une langue régionale"
        options={availableLanguages
          .map(({ code, label }) => {
            return { value: code, label: capitalize(label) };
          })
          .sort((a, b) => a.label.localeCompare(b.label))}
        selected={languageLabel}
        onSelect={({ value }) => handleLanguageCode(value)}
        width="fit-content"
        closeOnSelect
        hasFilter={false}
      >
        <Button
          type="button"
          width="fit-content"
          margin={0}
          fontStyle={codeISO ? "default" : "italic"}
        >
          <PropertyIcon marginRight={8} />{" "}
          {languageLabel || "Sélectionner une langue régionale"}
        </Button>
      </SelectMenu>

      <Pane
        display="grid"
        gridTemplateColumns="1fr 40px"
        marginTop={5}
        gap={10}
      >
        <AssistedTextField
          label=""
          forwadedRef={ref}
          exitFocus={() => setIsFocus(false)}
          isRequired={false}
          placeholder={`Nom en ${codeISO ? languageLabel : "langue régionale"}`}
          value={input}
          onChange={handleLanguageChange}
          isDisabled={!codeISO}
        />

        <Tooltip content="Supprimer la langue régionale">
          <Button
            type="button"
            aria-label="Supprimer la langue régionale"
            onClick={() => onDelete(codeISO)}
            intent="danger"
            width="fit-content"
            padding={0}
            marginTop={8}
          >
            <TrashIcon size={14} color="danger" />
          </Button>
        </Tooltip>
      </Pane>
    </Pane>
  );
}

export default LanguageField;

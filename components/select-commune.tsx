import { Pane, SelectField } from "evergreen-ui";

interface SelectCommuneProps {
  communes: {
    code: string;
    nom: string;
  }[];
  selectedCodeCommune: string;
  setSelectedCodeCommune: (code: string) => void;
  withOptionNull?: boolean;
  label?: string;
}

function SelectCommune({
  communes,
  selectedCodeCommune,
  setSelectedCodeCommune,
  withOptionNull = false,
  label = null,
}: SelectCommuneProps) {
  return (
    <Pane marginTop={8} >
      <SelectField
        label={label}
        value={selectedCodeCommune}
        onChange={(event) => setSelectedCodeCommune(event.target.value)}
        marginBottom={0}
      >
        {withOptionNull && <option key="null" value={null}></option>}
        {communes.map(({ code, nom }) => (
          <option key={code} value={code}>
            {nom} ({code})
          </option>
        ))}
      </SelectField>
    </Pane>
  );
}

export default SelectCommune;

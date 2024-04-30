import { Label, Tooltip, HelpIcon } from "evergreen-ui";

interface InputLabelProps {
  title: string;
  help?: string;
}

function InputLabel({ title, help }: InputLabelProps) {
  return (
    <Label marginTop={8} marginBottom={4}>
      {title}{" "}
      {help && (
        <Tooltip content={help}>
          <HelpIcon marginLeft={4} verticalAlign="middle" />
        </Tooltip>
      )}
    </Label>
  );
}

export default InputLabel;

import { Button, Pane } from "evergreen-ui";
import React from "react";
import NumeroEditor from "../bal/numero-editor";
import { CommuneType } from "@/types/commune";
import { Numero } from "@/lib/openapi";

interface SignalementCreateNumeroEditorProps {
  signalement: any;
  initialVoieId: string;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
  commune: CommuneType;
}

function SignalementCreateNumeroEditor({
  signalement,
  initialVoieId,
  handleSubmit,
  handleClose,
  commune,
}: SignalementCreateNumeroEditorProps) {
  return (
    <Pane position="relative" height="100%">
      <NumeroEditor
        hasPreview
        initialValue={signalement.changesRequested as Numero}
        initialVoieId={initialVoieId}
        commune={commune}
        closeForm={handleClose}
        onSubmitted={handleSubmit}
        certificationBtnChildren={
          <Button type="button" intent="danger" onClick={handleSubmit}>
            Ignorer
          </Button>
        }
      />
    </Pane>
  );
}

export default SignalementCreateNumeroEditor;

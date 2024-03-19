import React, { useState } from "react";
import { Button, Pane, Tab, Tablist } from "evergreen-ui";

import { BaseEditorProps, getBaseEditorProps } from "@/layouts/editor";
import ProtectedPage from "@/layouts/protected-page";
import {
  SignalementService,
  ToponymesService,
  VoiesService,
} from "@/lib/openapi";
import { useRouter } from "next/router";
import SignalementEditor from "@/components/signalement/signalement-editor";
import SignalementViewer from "@/components/signalement/signalement-viewer";
import { SignalementTypeEnum } from "@/lib/api-signalement/types";
import NumeroEditor from "@/components/bal/numero-editor";
import SignalementDeleteNumeroEditor from "@/components/signalement/signalement-delete-numero-editor";

function SignalementPage({ signalement, existingLocation, commune }) {
  const [activeTab, setActiveTab] = useState(1);
  const router = useRouter();

  const handleClose = () => {
    router.push(`/bal/${router.query.balId}/signalements`);
  };

  const handleSignalementProcessed = async () => {
    await SignalementService.updateSignalement({ id: signalement._id });
    handleClose();
  };

  return (
    <ProtectedPage>
      <Tablist margin={10}>
        {["Infos", "Editeur"].map((tab, index) => (
          <Tab
            key={tab}
            isSelected={activeTab === index}
            onSelect={() => setActiveTab(index)}
          >
            {tab}
          </Tab>
        ))}
      </Tablist>
      <Pane overflow="scroll" height="100%">
        {activeTab === 0 && (
          <SignalementViewer
            existingLocation={existingLocation}
            signalement={signalement}
          />
        )}
        {activeTab === 1 && (
          <>
            {signalement.type === SignalementTypeEnum.LOCATION_TO_CREATE && (
              <Pane position="relative" height="100%">
                <NumeroEditor
                  hasPreview
                  initialValue={signalement.changesRequested}
                  initialVoieId={existingLocation._id}
                  commune={commune}
                  closeForm={handleClose}
                  onSubmitted={handleSignalementProcessed}
                />
              </Pane>
            )}
            {signalement.type === SignalementTypeEnum.LOCATION_TO_UPDATE && (
              <SignalementEditor
                existingLocation={existingLocation}
                signalement={signalement}
                handleSubmit={handleSignalementProcessed}
                handleClose={handleClose}
                commune={commune}
              />
            )}
            {signalement.type === SignalementTypeEnum.LOCATION_TO_DELETE && (
              <SignalementDeleteNumeroEditor
                existingLocation={existingLocation}
                handleClose={handleClose}
                commune={commune}
                handleSubmit={handleSignalementProcessed}
              />
            )}
          </>
        )}
      </Pane>
    </ProtectedPage>
  );
}

const mapSignalementPositions = (positions) => {
  return positions.map((p) => ({
    point: p.position,
    source: "signalement",
    type: p.positionType,
  }));
};

export async function getServerSideProps({ params }) {
  const { balId }: { balId: string } = params;

  try {
    const { baseLocale, commune, voies, toponymes }: BaseEditorProps =
      await getBaseEditorProps(balId);

    const signalements = await SignalementService.getSignalements(
      baseLocale.commune
    );

    const signalement = signalements.find(
      (signalement) => signalement._id === params.idSignalement
    );

    if (signalement.changesRequested.positions) {
      signalement.changesRequested.positions = mapSignalementPositions(
        signalement.changesRequested.positions
      );
    }

    let existingLocation = null;
    if (
      signalement.type === SignalementTypeEnum.LOCATION_TO_UPDATE ||
      signalement.type === SignalementTypeEnum.LOCATION_TO_DELETE
    ) {
      if (signalement.existingLocation.type === "VOIE") {
        existingLocation = voies.find(
          (voie) => voie._id === signalement.existingLocation.nom
        );
      } else if (signalement.existingLocation.type === "TOPONYME") {
        existingLocation = toponymes.find(
          (toponyme) => toponyme._id === signalement.existingLocation.nom
        );
      } else if (signalement.existingLocation.type === "NUMERO") {
        if (signalement.existingLocation.toponyme.type === "VOIE") {
          const voie = voies.find(
            (voie) => voie.nom === signalement.existingLocation.toponyme.nom
          );
          const numeros = await VoiesService.findVoieNumeros(voie._id);
          existingLocation = numeros.find(({ numeroComplet }) => {
            const existingLocationNumeroComplet = signalement.existingLocation
              .suffixe
              ? `${signalement.existingLocation.numero}${signalement.existingLocation.suffixe}`
              : `${signalement.existingLocation.numero}`;
            return numeroComplet === existingLocationNumeroComplet;
          });
          existingLocation.voie = voie;
        } else {
          const toponyme = toponymes.find(
            (toponyme) =>
              toponyme.nom === signalement.existingLocation.toponyme.nom
          );
          const numeros = await ToponymesService.findToponymeNumeros(
            toponyme._id
          );
          existingLocation = numeros.find(({ numeroComplet }) => {
            const existingLocationNumeroComplet = signalement.existingLocation
              .suffixe
              ? `${signalement.existingLocation.numero}${signalement.existingLocation.suffixe}`
              : `${signalement.existingLocation.numero}`;
            return numeroComplet === existingLocationNumeroComplet;
          });
          existingLocation.toponyme = toponyme;
        }
      }
    } else if (signalement.type === SignalementTypeEnum.LOCATION_TO_CREATE) {
      existingLocation = voies.find(
        (voie) => voie.nom === signalement.existingLocation.nom
      );
    }

    return {
      props: {
        baseLocale,
        commune,
        voies,
        toponymes,
        signalement,
        existingLocation,
      },
    };
  } catch {
    return {
      error: {
        statusCode: 404,
      },
    };
  }
}

export default SignalementPage;

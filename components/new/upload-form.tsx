import {
  useState,
  useCallback,
  useEffect,
  useContext,
  Dispatch,
  SetStateAction,
  ChangeEventHandler,
} from "react";
import Router from "next/router";
import {
  validate,
  ValidateProfile,
  ValidateRowType,
} from "@ban-team/validateur-bal";
import { uniqBy } from "lodash";
import {
  Pane,
  Alert,
  Button,
  Dialog,
  TextInputField,
  Text,
  Strong,
  FormField,
  PlusIcon,
  InboxIcon,
  Paragraph,
  ShareIcon,
} from "evergreen-ui";

import LocalStorageContext from "@/contexts/local-storage";

import useFocus from "@/hooks/focus";

import FormContainer from "@/components/form-container";
import FormInput from "@/components/form-input";
import Uploader from "@/components/uploader";
import SelectCommune from "@/components/select-commune";
import AlertOtherBAL from "@/components/new/alert-other-bal";
import { CommuneApiGeoType } from "@/lib/geo-api/type";
import {
  BaseLocale,
  BasesLocalesService,
  ExtendedBaseLocaleDTO,
  OpenAPI,
  PageBaseLocaleDTO,
} from "@/lib/openapi-api-bal";
import { isExceptionClientId } from "./create-form";
import { ApiDepotService } from "@/lib/api-depot";
import { Revision } from "@/lib/api-depot/types";
import AlertPublishedBAL from "./alert-published-bal";
import LayoutContext from "@/contexts/layout";

const ADRESSE_URL =
  process.env.NEXT_PUBLIC_ADRESSE_URL || "https://adresse.data.gouv.fr";

const MAX_SIZE = 10 * 1024 * 1024;

const VALIDATEUR_LINK_TEXT = (
  <Text>
    Pour obtenir un rapport détaillé des erreurs qui ont été détectées,
    consultez{" "}
    <a
      href={`${ADRESSE_URL}/bases-locales/validateur`}
      target="_blank"
      rel="noreferrer"
    >
      le validateur de Bases Adresses Locales{" "}
      <ShareIcon verticalAlign="middle" />
    </a>
    .
  </Text>
);

function getFileExtension(name: string): string {
  const pos = name.lastIndexOf(".");
  if (pos > 0) {
    return name.slice(pos + 1);
  }

  return null;
}

function extractCommuneCodeFromRow({ parsedValues, additionalValues }): string {
  return (
    parsedValues.commune_insee || additionalValues?.cle_interop?.codeCommune
  );
}

type CommuneRow = {
  code: string;
  nom: string;
};

function extractCommuneFromCSV(rows: ValidateRowType[]): CommuneRow[] {
  // Get cle_interop and slice it to get the commune's code
  const communes: CommuneRow[] = rows.map(
    ({ parsedValues, additionalValues }) => ({
      code: extractCommuneCodeFromRow({ parsedValues, additionalValues }),
      nom: parsedValues.commune_nom as string,
    })
  );

  return uniqBy(communes, "code");
}

interface UploadFormProps {
  namePlaceholder: string;
  outdatedApiDepotClients: string[];
  outdatedHarvestSources: string[];
  handleCommune: Dispatch<SetStateAction<CommuneApiGeoType>>;
  nom: string;
  onNomChange: ChangeEventHandler<HTMLInputElement>;
  email: string;
  onEmailChange: ChangeEventHandler<HTMLInputElement>;
}

function UploadForm({
  namePlaceholder = "Nom",
  nom,
  outdatedApiDepotClients,
  outdatedHarvestSources,
  onNomChange,
  email,
  onEmailChange,
  handleCommune,
}: UploadFormProps) {
  const { isMobile } = useContext(LayoutContext);
  const [bal, setBal] = useState<BaseLocale | null>(null);
  const [file, setFile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusRef] = useFocus(true);
  const [userBALs, setUserBALs] = useState<ExtendedBaseLocaleDTO[]>([]);
  const [communes, setCommunes] = useState<CommuneRow[] | null>(null);
  const [selectedCodeCommune, setSelectedCodeCommune] = useState<string | null>(
    null
  );
  const [validationReport, setValidationReport] =
    useState<ValidateProfile | null>(null);
  const [invalidRowsCount, setInvalidRowsCount] = useState<number | null>(null);

  const [isShownAlertOtherBal, setIsShownAlertOtherBal] =
    useState<boolean>(false);
  const [isShownAlertPublishedBal, setIsShownAlertPublishedBal] =
    useState<boolean>(false);
  const [publishedRevision, setPublishedRevision] = useState<Revision>(null);

  const { addBalAccess } = useContext(LocalStorageContext);

  const onDrop = async ([file]) => {
    setError(null);
    setCommunes(null);
    handleCommune(null);
    setSelectedCodeCommune(null);
    if (file) {
      if (getFileExtension(file.name).toLowerCase() !== "csv") {
        return onError(
          "Ce type de fichier n’est pas supporté. Vous devez déposer un fichier CSV."
        );
      }

      // Detect multi communes
      const validationReport: ValidateProfile = (await validate(file, {
        profile: "1.3-relax",
      })) as ValidateProfile;
      const communes: CommuneRow[] = extractCommuneFromCSV(
        validationReport.rows
      );

      if (communes[0]) {
        handleCommune(communes[0] as CommuneApiGeoType);
        setSelectedCodeCommune(communes[0].code);
        if (communes.length > 1) {
          setCommunes(communes);
        }

        setValidationReport(validationReport);
        setFile(file);
      } else {
        onError("Aucune commune n’a pu être trouvée.");
      }
    }
  };

  const onDropRejected = (rejectedFiles) => {
    const [file] = rejectedFiles;

    if (rejectedFiles.length > 1) {
      onError("Vous ne pouvez déposer qu’un seul fichier.");
    } else if (file.size > MAX_SIZE) {
      return onError(
        "Ce fichier est trop volumineux. Vous devez déposer un fichier de moins de 10 Mo."
      );
    } else {
      onError("Impossible de déposer ce fichier");
    }
  };

  const createNewBal = useCallback(
    async (codeCommune) => {
      if (!bal) {
        const baseLocale: BaseLocale =
          await BasesLocalesService.createBaseLocale({
            nom,
            commune: codeCommune,
            emails: [email],
          });

        addBalAccess(baseLocale.id, baseLocale.token);
        setBal(baseLocale);
      }
    },
    [bal, email, nom, addBalAccess]
  );

  const resetForm = () => {
    setFile(null);
    setIsShownAlertPublishedBal(false);
    setIsShownAlertOtherBal(false);
    setIsLoading(false);
    setCommunes(null);
    handleCommune(null);
    setSelectedCodeCommune(null);
    setValidationReport(null);
    setInvalidRowsCount(null);
  };

  const onError = useCallback((error) => {
    resetForm();
    setError(error);
  }, []);

  const onCancel = () => {
    resetForm();
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // CHECK OTHER BAL PUBLISH
    try {
      const revision: Revision =
        await ApiDepotService.getCurrentRevision(selectedCodeCommune);
      if (
        revision &&
        !isExceptionClientId(
          revision,
          outdatedApiDepotClients,
          outdatedHarvestSources
        )
      ) {
        setIsShownAlertPublishedBal(true);
        setPublishedRevision(revision);
        return;
      }
    } catch {}

    // CHECK OTHER BAL IN MES_ADRESSES
    try {
      await checkOtherBALs();
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const checkOtherBALs = useCallback(async () => {
    const response: PageBaseLocaleDTO =
      await BasesLocalesService.searchBaseLocale(
        "10",
        "0",
        "false",
        selectedCodeCommune,
        email
      );

    if (response.results.length > 0) {
      setUserBALs(response.results);
      setIsShownAlertOtherBal(true);
    } else {
      createNewBal(selectedCodeCommune);
    }
  }, [createNewBal, email, selectedCodeCommune]);

  useEffect(() => {
    if (selectedCodeCommune && validationReport) {
      // Get invalid rows of selected commune
      const invalidRowsCount = validationReport.rows.filter(
        (row) =>
          !row.isValid && extractCommuneCodeFromRow(row) === selectedCodeCommune
      ).length;
      setInvalidRowsCount(invalidRowsCount);
    }
  }, [selectedCodeCommune, validationReport]);

  useEffect(() => {
    async function upload() {
      try {
        Object.assign(OpenAPI, { TOKEN: bal.token });
        // Force content type to be text/csv
        // To fix application/vnd.ms-excel issue on Windows and Firefox
        const blobFile = new Blob([file as Blob], {
          type: "text/csv",
        });
        const response = await BasesLocalesService.uploadCsvBalFile(bal.id, {
          file: blobFile,
        });
        if (response.isValid) {
          Router.push(`/bal/${bal.id}`);
        } else {
          onError(VALIDATEUR_LINK_TEXT);
        }
      } catch (error) {
        setError(error.message);
      }
    }

    if (file && bal && selectedCodeCommune) {
      setIsLoading(true);
      upload();
    }
  }, [bal, selectedCodeCommune, file, onError]);

  useEffect(() => {
    if (file || error) {
      setIsLoading(false);
    }
  }, [error, file]);

  useEffect(() => {
    setError(null);
  }, [nom, file, email]);

  return (
    <>
      <Pane marginY={32} flex={1} overflowY="scroll">
        <FormContainer onSubmit={onSubmit}>
          {isShownAlertOtherBal && (
            <AlertOtherBAL
              isShown={isShownAlertOtherBal}
              userEmail={email}
              basesLocales={userBALs}
              updateBAL={() => checkOtherBALs()}
              onConfirm={() => createNewBal(selectedCodeCommune)}
              onClose={() => onCancel()}
            />
          )}

          {isShownAlertPublishedBal && (
            <AlertPublishedBAL
              isShown={isShownAlertPublishedBal}
              revision={publishedRevision}
              onConfirm={() => createNewBal(selectedCodeCommune)}
              onClose={() => onCancel()}
            />
          )}

          <Pane display="flex" flexDirection={isMobile ? "column" : "row"}>
            <Pane flex={1} maxWidth={600}>
              <FormInput>
                <TextInputField
                  ref={focusRef}
                  required
                  autoComplete="new-password" // Hack to bypass chrome autocomplete
                  name="nom"
                  id="nom"
                  marginBottom={0}
                  value={nom}
                  disabled={isLoading}
                  label="Nom de la Base Adresse Locale"
                  placeholder={namePlaceholder}
                  onChange={onNomChange}
                />
              </FormInput>

              <FormInput>
                <TextInputField
                  required
                  type="email"
                  name="email"
                  id="email"
                  marginBottom={0}
                  value={email}
                  disabled={isLoading}
                  label="Votre adresse email"
                  placeholder="nom@example.com"
                  onChange={onEmailChange}
                />
              </FormInput>
            </Pane>

            <Pane flex={1} marginLeft={isMobile ? 0 : 16}>
              <FormInput>
                <FormField label="Fichier CSV" />
                <Uploader
                  file={file}
                  maxSize={MAX_SIZE}
                  height={150}
                  marginBottom={24}
                  placeholder="Sélectionnez ou glissez ici votre fichier BAL au format CSV (maximum 10 Mo)"
                  loadingLabel="Analyse en cours"
                  disabled={isLoading}
                  onDrop={onDrop}
                  onDropRejected={onDropRejected}
                  isLoading={isLoading}
                />
              </FormInput>
            </Pane>
          </Pane>

          {communes && (
            <Alert marginBottom={16} intent="warning" title="Attention">
              <Text>
                Le fichier comporte plusieurs communes. Pour gérer plusieurs
                communes, vous devez créer plusieurs Bases Adresses Locales.
                Veuillez choisir une commune, puis validez à nouveau le
                formulaire.
              </Text>
              <SelectCommune
                communes={communes}
                selectedCodeCommune={selectedCodeCommune}
                setSelectedCodeCommune={setSelectedCodeCommune}
              />
            </Alert>
          )}

          <Dialog
            isShown={invalidRowsCount > 0}
            title="Le fichier comporte des erreurs"
            intent="danger"
            onConfirm={() => setInvalidRowsCount(null)}
            onCancel={onCancel}
            confirmLabel="Utiliser uniquement les adresses conformes"
            cancelLabel="Annuler"
            hasClose={false}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEscapePress={false}
          >
            <Paragraph>
              {invalidRowsCount > 1 ? (
                <>
                  <Strong>
                    {invalidRowsCount} lignes comportent au moins une erreur
                  </Strong>{" "}
                  et ne pourront pas être importées dans votre Base Adresse
                  Locale.
                </>
              ) : (
                <>
                  <Strong>1 ligne comporte au moins une erreur</Strong> et ne
                  pourra pas être importée dans votre Base Adresse Locale.
                </>
              )}
            </Paragraph>

            <Paragraph marginTop={8}>
              En continuant, seules les adresses conformes seront utilisées pour
              créer votre Base Adresse Locale.
            </Paragraph>

            <Alert title="Plus d’informations" marginTop={8}>
              {VALIDATEUR_LINK_TEXT}
            </Alert>
          </Dialog>

          {error && (
            <Alert marginBottom={16} intent="danger" title="Erreur">
              <Text>{error}</Text>
            </Alert>
          )}

          <Button
            height={40}
            type="submit"
            appearance="primary"
            intent="success"
            disabled={Boolean(error) || !file}
            isLoading={isLoading}
            iconAfter={isLoading ? null : PlusIcon}
          >
            {isLoading
              ? "En cours de création…"
              : "Créer la Base Adresse Locale"}
          </Button>
        </FormContainer>
      </Pane>

      <Alert
        margin={16}
        title="Vous disposez déjà d’une Base Adresse Locale au format CSV gérée à partir d’un autre outil ?"
        marginY={16}
        hasIcon={isMobile ? false : true}
      >
        <Text>
          Utilisez notre formulaire de dépôt afin de publier vos adresses dans
          la Base Adresse Nationale.
        </Text>
        <Pane marginTop={16}>
          <Button
            appearance="primary"
            iconBefore={InboxIcon}
            is="a"
            href="https://adresse.data.gouv.fr/bases-locales/publication"
          >
            {isMobile
              ? "Accéder au formulaire"
              : "Accéder au formulaire de dépôt d’une Base Adresse Locale sur adresse.data.gouv.fr"}
          </Button>
        </Pane>
      </Alert>
    </>
  );
}

export default UploadForm;

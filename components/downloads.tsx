import {
  Pane,
  Heading,
  Link,
  DownloadIcon,
  Checkbox,
  Alert,
  Button,
  Text,
  Label,
} from "evergreen-ui";
import { useContext, useState } from "react";
import { ExportCsvService } from "@/lib/openapi-api-bal";
import TokenContext from "@/contexts/token";

interface DownloadsProps {
  baseLocaleId: string;
}

function Downloads({ baseLocaleId }: DownloadsProps) {
  const { token } = useContext(TokenContext);
  const [withComment, setWithComment] = useState(false);

  const downloadFile = (file: string, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([file]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const downloadBalCsv = async () => {
    const file = await ExportCsvService.getCsvBal(withComment, baseLocaleId);
    downloadFile(file, "bal.csv");
  };

  const downloadVoieCsv = async () => {
    const file = await ExportCsvService.getCsvVoies(baseLocaleId);
    downloadFile(file, "liste-des-voies.csv");
  };

  return (
    <Pane>
      <Pane
        flexShrink={0}
        elevation={0}
        background="white"
        padding={16}
        display="flex"
        alignItems="center"
        minHeight={64}
      >
        <Pane display="flex" alignItems="center">
          <DownloadIcon />
          <Heading paddingLeft={5}>Téléchargements</Heading>
        </Pane>
      </Pane>
      <Pane is="ul" display="flex" flexDirection="column" overflowY="scroll">
        <Pane is="li" marginBottom={10}>
          <Pane display="flex" alignItems="center">
            <Link
              style={{ cursor: "pointer" }}
              onClick={downloadBalCsv}
              marginRight={12}
            >
              Base Adresse Locale (format CSV)
            </Link>
            {token && (
              <>
                <Checkbox
                  checked={withComment}
                  onChange={(e) => setWithComment(e.target.checked)}
                />
                <Text marginLeft={6}>Avec commentaires</Text>
              </>
            )}
          </Pane>
          {withComment && (
            <Alert marginLeft={-30} marginRight={10} hasIcon={false}>
              <Text is="p" textAlign="center">
                Attention, si vous avez renseigné des informations à caractère
                personnel dans vos commentaires, celles-ci seront présentes dans
                l’export de votre Base Adresse Locale.
              </Text>
            </Alert>
          )}
        </Pane>
        <Pane is="li" marginBottom={10}>
          <Link style={{ cursor: "pointer" }} onClick={downloadVoieCsv}>
            Liste des voies (format CSV)
          </Link>
        </Pane>
      </Pane>
    </Pane>
  );
}

export default Downloads;

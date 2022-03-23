import {
  Layout,
  Page,
  Card,
  Form,
  FormLayout,
  TextField,
  SettingToggle,
  TextStyle,
  Banner,
  Button,
  Stack,
} from "@shopify/polaris";
import { SketchPicker } from "react-color";
import React, { useEffect, useState, useCallback } from "react";
import { useAxios } from "../hooks/useAxios";

function Index() {
  const [axios] = useAxios();
  const [isInstalled, setIsInstalled] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState({ isValid: true, msg: "" });
  const [metafieldId, setMetafieldId] = useState();
  const [scriptTagId, setScriptTagId] = useState();
  const titleDescription = isInstalled ? "Desinstalar" : "Instalar";
  const bodyDescription = isInstalled ? "instalado" : "desinstalado";

  /* Achar contraste */
  function invertColor(hex, bw) {
    if (hex.indexOf("#") === 0) {
      hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
      throw new Error("Invalid HEX color.");
    }
    var r = parseInt(hex.slice(0, 2), 16),
      g = parseInt(hex.slice(2, 4), 16),
      b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
      return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF";
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
  }

  /* Nome do pix */
  const [nomePix, setNomePix] = useState("");
  const alteraNomePix = useCallback(function (value) {
    document.querySelector("#beneficiario").innerHTML = value;
    setNomePix(value)
  });

  /* Chave PIX */
  const [chave, setChave] = useState("");
  const alteraChave = useCallback(function (value) {
    document.querySelector("#chavePix").innerHTML = value;
    setChave(value)
  });

  /* Nome do banco */
  const [nomeBanco, setNomeBanco] = useState("");
  const alteraNomeBanco = useCallback(function (value) {
    document.querySelector("#nomeBanco").innerHTML = value;
    setNomeBanco(value)
  });

  /* Nome da cidade */
  const [nomeCidade, setNomeCidade] = useState("");
  const alteraNomeCidade = useCallback((value) => setNomeCidade(value), []);

  /* Mensagem custom */
  const [mensagem, setMensagem] = useState("");
  const alteraMensagem = useCallback(function (value) {
    document.querySelector(".pixCustomInfo").innerHTML = value;
    setMensagem(value);
  });

  /* Cor do background */
  const [color, setColor] = useState("#000000");

  const alteraColor = useCallback(function (value) {
    console.log("alteraColor", value);
    setColor(value.hex);
    //containerPixTeste.style.backgroundColor = color;
  });

  useEffect(() => {
    var corSecundary = invertColor(color, true);

    document.querySelector(".pixSection").style.backgroundColor = color;
    document.querySelector(".pixTitle").style.color = corSecundary;
    document.querySelector(".pixCustomInfo").style.color = corSecundary;
    document.querySelector(".pixPreco").style.color = corSecundary;
    document.querySelector(".pixBotao").style.backgroundColor = corSecundary;
    document.querySelector(".pixBotao").style.color = color;
  }, [color]);

  async function fetchScriptTags() {
    const { data = {} } = await axios.get("/scripts");
    console.log("O PIX está atualmente: ", data);
    setIsInstalled(data.installed);
    /* if (data.details && data.details.length > 0) {
      setScriptTagId(data.details[0]);
    } */
    setScriptTagId(data.scriptTagId);
  }

  const setFields = useCallback(
    async ({ bankName, bg, city, fullName, message, pixKey }) => {
      if (bg) setColor(bg);
      if (fullName) setNomePix(fullName);
      if (pixKey) setChave(pixKey);
      if (bankName) setNomeBanco(bankName);
      if (city) setNomeCidade(city);
      if (message) setMensagem(message);
    },
    [nomePix, chave, nomeBanco, nomeCidade, mensagem, color]
  );

  async function fetchMetafields() {
    try {
      const { data } = await axios.get("/metafields");
      console.log("fetchMetafields", data);

      if (data && data.id) {
        const { id } = data;
        if (id) setMetafieldId(id);
        setFields(data);
      }
    } catch (e) {
      console.log(e);
      // Metafield inexistente
    }
  }

  useEffect(() => {
    fetchScriptTags();
  }, []);

  useEffect(() => {
    if (!metafieldId) fetchMetafields();
  }, []);

  const handleToggle = useCallback(async () => {
    setIsSaving(true);
    try {
      const options = {
        method: !isInstalled ? "post" : "delete",
        url: !isInstalled ? "/scripts" : `/scripts/${scriptTagId}`,
      };

      if (!isInstalled && scriptTagId) {
        options.data = {
          id: scriptTagId,
        };
      }

      const body = await axios(options);
      console.log(body);

      const {
        data: { installed },
      } = body;

      setIsInstalled(!!installed);
      setScriptTagId(undefined);
    } finally {
      setIsSaving(false);
    }
  }, [isInstalled, scriptTagId]);

  const handleSubmit = useCallback(
    (_event) => {
      setIsSaving(true);
      setSavingStatus("");
      setSavingStatus({
        isValid: true,
        msg: "Salvando informações...",
      });
      const payload = {
        bankName: String(nomeBanco).trim(),
        bg: String(color).trim(),
        city: String(nomeCidade).trim(),
        fullName: String(nomePix).trim(),
        message: String(mensagem).trim(),
        pixKey: String(chave).trim(),
      };

      console.log("metafieldId", metafieldId);
      console.log("payload", payload);

      axios({
        method: !metafieldId ? "post" : "put",
        url: !metafieldId ? "/metafields" : `/metafields/${metafieldId}`,
        data: payload,
      })
        .then(({ data }) => {
          const { success, metafield, error } = data;
          if (!success || !metafield) {
            throw new Error(error);
          }
          setSavingStatus({
            isValid: true,
            msg: "Salvo com sucesso!",
          });

          if (metafield.id) {
            setMetafieldId(metafield.id);
          }

          axios[!isInstalled ? "post" : "put"]("/scripts", { scriptTagId })
            .then((res) => {
              if (res && res.details && res.details.length > 0) {
                setScriptTagId(res.scriptTagId);
                setIsInstalled(true);
              }
            })
            .catch(() => {
              setIsInstalled(false);
              setScriptTagId(null);
            });
        })
        .catch((e) => {
          console.log(e);
          setSavingStatus({
            isValid: false,
            msg: "Ocorreu um erro ao salvar as alterações. Tente novamente.",
          });
        })
        .finally(() => setIsSaving(false));
    },
    [nomePix, chave, nomeBanco, nomeCidade, mensagem, color]
  );

  return (
    <Page>
      <Layout>
        {/* Configurações do PIX */}
        <Layout.AnnotatedSection
          id="informacoes"
          title="Informações do PIX"
          description="Preencha as informações ao lado usando seus dados reais."
        >
          <br />
          <Card sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  value={nomePix}
                  onChange={alteraNomePix}
                  disabled={isSaving}
                  label="Nome do PIX (Conforme registrado no banco)"
                  autoComplete="off"
                />
                <TextField
                  value={chave}
                  onChange={alteraChave}
                  disabled={isSaving}
                  label="Chave PIX"
                />
                <TextField
                  value={nomeBanco}
                  onChange={alteraNomeBanco}
                  disabled={isSaving}
                  label="Nome da instituição financeira"
                />
                <TextField
                  value={nomeCidade}
                  onChange={alteraNomeCidade}
                  disabled={isSaving}
                  label="Nome da cidade"
                />
                <TextField
                  label="Mensagem customizada"
                  value={mensagem}
                  onChange={alteraMensagem}
                  multiline={6}
                  autoComplete="off"
                  disabled={isSaving}
                />
                <Stack>
                  <Stack.Item fill>
                    <TextStyle
                      variation={savingStatus.isValid ? "positive" : "negative"}
                    >
                      {savingStatus.msg}
                    </TextStyle>
                  </Stack.Item>
                  <Stack.Item>
                    <Button
                      primary
                      loading={isSaving}
                      disabled={isSaving}
                      submit
                    >
                      Salvar
                    </Button>
                  </Stack.Item>
                </Stack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.AnnotatedSection>

         {/* Personalização de Cor */}
         <Layout.AnnotatedSection
          id="personalize"
          title="Personalização"
          description="Hora de personalizar."
        >
          <Layout sectioned={false}>
            <Layout.Section>
              <Card title="Cor de fundo" sectioned>
                <SketchPicker onChange={alteraColor} color={color} />
                <br />
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.AnnotatedSection>
        
        {/* Banner de instalação */}
        <Layout.AnnotatedSection
          id="instalacao"
          title="Instale na loja"
          description=""
        >
          <Card sectioned>
            <SettingToggle
              action={{
                content: titleDescription,
                onAction: handleToggle,
                loading: isSaving,
                disabled: isSaving,
              }}
              enabled={true}
            >
              O script do PIX está{" "}
              <TextStyle variation="strong">{bodyDescription}</TextStyle>
            </SettingToggle>
          </Card>
        </Layout.AnnotatedSection>

        {/* Visualização em tempo real */}
        <Layout.AnnotatedSection
          id="demo"
          title="Visualize em tempo real"
          description=""
        >
          <Card sectioned>
            <div className="pixSection" borbg="secundary">
              <h3 cortext="secundary" className="pixTitle">
                Use o QR code do Pix para pagar
              </h3>
              <p
                cortext="secundary"
                className="pixCustomInfo"
              >
                Insira aqui sua mensagem customizada, incluindo se precisar o
                tempo para realização do pagamento e para onde enviar o
                comprovante
              </p>
              <div>
                <img
                  src="https://chart.googleapis.com/chart?chs=250x250&amp;chld=L%7C1&amp;cht=qr&amp;chl=%22Este%20%C3%A9%20um%20exemplo%20de%20QR%20Code%20by%20Alfient%22"
                  alt="Exemplo de QR"
                  className="pixQr"
                />
              </div>
              <p cortext="secundary" className="pixPreco">
                R$90,00
              </p>
              <a
                id="botaoCopiar"
                cortext="primary"
                corbg="secundary"
                className="pixBotao"
              >
                Copiar código do QR Code
              </a>
            </div>
            <div className="boxInfos">
              <p className="separadorOu">Ou use <strong>a chave Pix</strong></p>
              <div className="flex flex-column flex-nowrap w-100 f6-ns bt-ns b--black-10 pt4-ns mt4 mt0-ns">
              <div id="copy-alias" className="flex justify-between pb3" data-clipboard-text="12418423611">
                <span className="justify-start b tl">Chave Pix (CNPJ)</span>
                <span className="copy-icon-alias">
                  <span className="justify-end pixkey" id="chavePix">12418423611</span>
                  <div className="tooltip">
                    <span id="tooltiptext" className="tooltiptext">Copiado!</span>
                  </div>
                </span>
              </div>
              <div className="flex justify-between pb3">
                  <span className="b tl">Nome</span>
                  <span id="beneficiario">Luiz Henrique de Medeiros Nogueira</span>
              </div>
              <div className="flex justify-between pb3">
                  <span className="b tl">Banco</span>
                  <span id="nomeBanco">Itau Unibanco</span>
              </div>
              <div className="flex justify-between pb3">
                  <span className="b tl">Identificador</span>
                  <span>PEDIDO9999</span>
              </div>
            </div>
          </div>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}

export default Index;
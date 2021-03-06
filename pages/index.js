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
  const alteraNomePix = useCallback((value) => setNomePix(value), []);

  /* Chave PIX */
  const [chave, setChave] = useState("");
  const alteraChave = useCallback((value) => setChave(value), []);

  /* Nome do banco */
  const [nomeBanco, setNomeBanco] = useState("");
  const alteraNomeBanco = useCallback((value) => setNomeBanco(value), []);

  /* Nome da cidade */
  const [nomeCidade, setNomeCidade] = useState("");
  const alteraNomeCidade = useCallback((value) => setNomeCidade(value), []);

  /* Mensagem custom */
  const [mensagem, setMensagem] = useState("");
  const alteraMensagem = useCallback(function (value) {
    var mensagem = document.querySelector(".pixCustomInfo");
    mensagem.innerHTML = value;
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
    const { data } = await axios.get("/script_tag/all");
    console.log("O PIX est?? atualmente: ", data);
    setIsInstalled(data.installed);
    if (data.details.length > 0) {
      setScriptTagId(data.details[0].id);
    }
  }

  const setFields = useCallback(
    async ({ bankName, bg, city, fullName, message, pixKey }) => {
      if (bg) setColor(bg);
      if (fullName) setNomePix(fullName);
      if (pixKey) setChave(pixKey);
      if (bankName) setNomeBanco(bankName);
      if (city) setNomeCidade(city);
      if (message) setMensagem(message);
    }
  );

  async function fetchMetafields() {
    try {
      const { data } = await axios.get("/metafields");
      console.log("fetchMetafields", data);

      if (data && data.id) {
        const { id, value } = data;
        setMetafieldId(id);
        if (typeof value === "object") {
          setFields(value);
        }
      }
    } catch (e) {
      console.log(e);
      // Metafield inexistente
    }
  }

  useEffect(() => {
    fetchScriptTags();
  }, [isInstalled]);

  useEffect(() => {
    fetchMetafields();
  }, [metafieldId]);

  async function handleAction() {
    if (!isInstalled) {
      axios.post("/script_tag/");
    } else {
      axios.delete(`/script_tag/?id=${scriptTagId}`);
    }
    setIsInstalled((oldValue) => !oldValue);
  }

  const handleSubmit = useCallback((_event) => {
    setIsSaving(true);
    setSavingStatus("");
    setSavingStatus({
      isValid: true,
      msg: "Salvando informa????es...",
    });
    const paylaod = {
      bankName: String(nomeBanco).trim(),
      bg: String(color).trim(),
      city: String(nomeCidade).trim(),
      fullName: String(nomePix).trim(),
      message: String(mensagem).trim(),
      pixKey: String(chave).trim(),
    };

    console.log("metafieldId", metafieldId);
    axios({
      method: !metafieldId ? "post" : "put",
      url: !metafieldId ? "/metafields" : `/metafields/${metafieldId}`,
      data: paylaod,
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

        if (!isInstalled || !scriptTagId) {
          axios.post("/script_tag");
        } else {
          axios.put(`/script_tag/?id=${scriptTagId}`);
        }
      })
      .catch((e) => {
        console.log(e);
        setSavingStatus({
          isValid: false,
          msg: "Ocorreu um erro ao salvar as altera????es. Tente novamente.",
        });
      })
      .finally(() => setIsSaving(false));
  }, []);

  /* Estilos */
  const pixSection = {
    textAlign: "center",
    backgroundColor: "#000",
    padding: "30px",
    borderRadius: "5px",
  };

  const pixTitle = {
    fontSize: "25px",
    fontWeight: "700",
    color: "#fff",
  };

  const pixCustomInfo = {
    margin: "20px",
    color: "#fff",
  };

  const pixQr = {
    maxWidth: "205px",
    margin: "0 auto",
  };

  const pixPreco = {
    fontSize: "23px",
    color: "#fff",
    margin: "15px auto",
    fontWeight: "500",
  };

  const pixBotao = {
    backgroundColor: "#fff",
    maxWidth: "100%",
    width: "400px",
    display: "block",
    margin: "0 auto",
    fontSize: "16px",
    padding: "15px 0",
    borderRadius: "5px",
    position: "relative",
  };
  return (
    <Page>
      <Layout>
        {/* Configura????es do PIX */}
        <Layout.AnnotatedSection
          id="informacoes"
          title="Informa????es do PIX"
          description="Preencha as informa????es ao lado usando seus dados reais."
        >
          <Banner title="Observa????o" onDismiss={() => {}}>
            <p>As altera????es podem demorar at?? 5 minutos para propagar.</p>
          </Banner>
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
                  label="Nome da institui????o financeira"
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
                  clearButton={true}
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

        {/* Personaliza????o de Cor */}
        <Layout.AnnotatedSection
          id="personalize"
          title="Personaliza????o"
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

        {/* Banner de instala????o */}
        <Layout.AnnotatedSection
          id="instalacao"
          title="Instale na loja"
          description=""
        >
          <Card sectioned>
            <SettingToggle
              action={{
                content: titleDescription,
                onAction: handleAction,
              }}
              enabled={true}
            >
              O script do PIX est??{" "}
              <TextStyle variation="strong">{bodyDescription}</TextStyle>
            </SettingToggle>
          </Card>
        </Layout.AnnotatedSection>

        {/* Visualiza????o em tempo real */}
        <Layout.AnnotatedSection
          id="demo"
          title="Visualize em tempo real"
          description=""
        >
          <Card sectioned>
            <div className="pixSection" borbg="secundary" style={pixSection}>
              <h3 cortext="secundary" style={pixTitle} className="pixTitle">
                Use o QR code do Pix para pagar
              </h3>
              <p
                cortext="secundary"
                style={pixCustomInfo}
                className="pixCustomInfo"
              >
                Insira aqui sua mensagem customizada, incluindo se precisar o
                tempo para realiza????o do pagamento e para onde enviar o
                comprovante
              </p>
              <div>
                <img
                  src="https://chart.googleapis.com/chart?chs=250x250&amp;chld=L%7C1&amp;cht=qr&amp;chl=%22Este%20%C3%A9%20um%20exemplo%20de%20QR%20Code%20by%20Alfient%22"
                  alt="Exemplo de QR"
                  className="pixQr"
                  style={pixQr}
                />
              </div>
              <p cortext="secundary" className="pixPreco" style={pixPreco}>
                R$90,00
              </p>
              <a
                id="botaoCopiar"
                cortext="primary"
                corbg="secundary"
                className="pixBotao"
                style={pixBotao}
              >
                Copiar c??digo do QR Code
              </a>
            </div>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}

export default Index;

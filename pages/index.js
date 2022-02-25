import {
  Layout,
  Page,
  Card,
  Form,
  TextField,
  SettingToggle,
  TextStyle,
  Banner,
} from "@shopify/polaris";
import { SketchPicker } from "react-color";
import React, { useEffect, useState, useCallback } from "react";
import { useAxios } from "../hooks/useAxios";

function Index() {
  const [axios] = useAxios();
  const [isInstalled, setIsInstalled] = useState(null);
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
    console.log("Teste");
    setNomePix(value);
  });

  /* Chave PIX */
  const [chave, setChave] = useState("");
  const alteraChave = useCallback((value) => setChave(value), []);

  /* Nome do banco */
  const [nomeBanco, setNomeBanco] = useState("");
  const alteraNomeBanco = useCallback((value) => setNomeBanco(value), []);

  /* Mensagem custom */
  const [mensagem, setMensagem] = useState("");
  const alteraMensagem = useCallback(function (value) {
    var mensagem = document.querySelector(".pixCustomInfo");
    mensagem.innerHTML = value;
    setMensagem(value);
  });

  /* Cor do background */
  const [color, setColor] = useState({
    hex: "#000000",
    hsl: { h: 249.99999999999994, s: 0, l: 0, a: 1 },
    hsv: { h: 249.99999999999994, s: 0, v: 0, a: 1 },
    oldHue: 249.99999999999994,
    rgb: { r: 0, g: 0, b: 0, a: 1 },
    source: "hsv",
  });

  const alteraColor = useCallback(function (value) {
    setColor(value);
    //containerPixTeste.style.backgroundColor = color;
  });

  useEffect(() => {
    var corPrimary = color.hex;
    var corSecundary = invertColor(corPrimary, true);

    document.querySelector(".pixSection").style.backgroundColor = corPrimary;
    document.querySelector(".pixTitle").style.color = corSecundary;
    document.querySelector(".pixCustomInfo").style.color = corSecundary;
    document.querySelector(".pixPreco").style.color = corSecundary;
    document.querySelector(".pixBotao").style.backgroundColor = corSecundary;
    document.querySelector(".pixBotao").style.color = corPrimary;
  }, [color]);

  async function fetchScriptTags() {
    const { data } = await axios.get("/script_tag/all");
    console.log("O PIX está atualmente: ", data);
    setIsInstalled(data.installed);
    if (data.details.length > 0) {
      setScriptTagId(data.details[0].id);
    }
  }

  useEffect(() => {
    fetchScriptTags();
  }, [isInstalled]);

  async function handleAction() {
    if (!isInstalled) {
      axios.post("/script_tag/");
    } else {
      axios.delete(`/script_tag/?id=${scriptTagId}`);
    }
    setIsInstalled((oldValue) => !oldValue);
  }

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
        {/* Configurações do PIX */}
        <Layout.AnnotatedSection
          id="informacoes"
          title="Informações do PIX"
          description="Preencha as informações ao lado usando seus dados reais."
        >
          <Banner title="Observação" onDismiss={() => {}}>
            <p>As alterações podem demorar até 5 minutos para propagar.</p>
          </Banner>
          <br />
          <Card sectioned>
            <Form>
              <TextField
                value={nomePix}
                onChange={alteraNomePix}
                label="Nome do PIX (Conforme registrado no banco)"
                autoComplete="off"
              />
              <TextField
                value={chave}
                onChange={alteraChave}
                label="Chave PIX"
              />
              <TextField
                value={nomeBanco}
                onChange={alteraNomeBanco}
                label="Nome da instituição financeira"
              />
              <TextField
                label="Mensagem customizada"
                value={mensagem}
                onChange={alteraMensagem}
                multiline={6}
                autoComplete="off"
                clearButton={true}
              />
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
                onAction: handleAction,
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
                tempo para realização do pagamento e para onde enviar o
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
                Copiar código do QR Code
              </a>
            </div>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}

export default Index;

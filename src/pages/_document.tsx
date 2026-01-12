import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" data-scroll-behavior="smooth">
        <Head>
          <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

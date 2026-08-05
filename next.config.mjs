/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // QR code dynamique imprime sur la PLV. Le motif du QR contient
      // roadsixtygeek.com/qr en dur : ce chemin ne doit jamais disparaitre,
      // sinon les QR deja en magasin cessent de fonctionner.
      // La destination reelle se pilote depuis le service r6g-qr.
      { source: '/qr', destination: 'https://r6g-qr.vercel.app/qr' }
    ];
  }
};
export default nextConfig;

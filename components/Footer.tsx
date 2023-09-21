/**
 * Renders the footer component.
 *
 * @return {JSX.Element} The footer component.
 */
const Footer = () => {
  return (
    <footer className="text-center bg-slate-600 text-white p-4 mt-8">
      <p>
        &copy; 2023 FileSolvers - Created by{" "}
        <a
          className="underline font-bold"
          href="https://linktr.ee/falconandrea"
          title="My links"
          target="_blank"
          rel="noreferrer"
        >
          Falcon Andrea
        </a>
      </p>
    </footer>
  );
};
export default Footer;

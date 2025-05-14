# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Canal de nixpkgs más reciente y estable
  channel = "stable-24.11";

  # Paquetes necesarios para el desarrollo
  packages = [
    # Node.js y npm
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.nodePackages.pnpm
    pkgs.nodePackages.yarn

    # Herramientas de desarrollo
    pkgs.git
    pkgs.curl
    pkgs.wget
    pkgs.jq
    pkgs.ripgrep
    pkgs.fd
    pkgs.gh # GitHub CLI

    # Herramientas de Solana
    pkgs.solana
    pkgs.anchor

    # Herramientas de testing
    pkgs.chromium
    pkgs.firefox
  ];

  # Variables de entorno
  env = {
    # Configuración de Node.js
    NODE_ENV = "development";
    NODE_OPTIONS = "--max-old-space-size=4096";

    # Configuración de Solana
    SOLANA_NETWORK = "devnet";
    ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";

    # Configuración de TypeScript
    TSC_COMPILE_ON_ERROR = "true";
    ESLINT_NO_DEV_ERRORS = "true";

    # Configuración de Next.js
    NEXT_TELEMETRY_DISABLED = "1";
  };

  idx = {
    # Extensiones recomendadas para VS Code
    extensions = [
      # TypeScript y JavaScript
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "ms-vscode.vscode-typescript-next"

      # Solana
      "project-serum.solana-vscode"
      "coral-xyz.anchor"

      # Git
      "eamodio.gitlens"
      "mhutchie.git-graph"

      # Testing
      "kavod-io.vscode-jest-test-adapter"
      "hbenl.vscode-test-explorer"

      # Productividad
      "streetsidesoftware.code-spell-checker"
      "formulahendry.auto-rename-tag"
      "formulahendry.auto-close-tag"
      "christian-kohler.path-intellisense"
      "naumovs.color-highlight"
    ];

    # Configuración del workspace
    workspace = {
      onCreate = {
        # Archivos que se abren al iniciar
        default.openFiles = [
          "src/app/page.tsx"
          "README.md"
          "package.json"
        ];

        # Comandos que se ejecutan al iniciar
        init = [
          "npm install"
          "npm run build"
        ];
      };

      # Configuración de la terminal
      terminal = {
        # Shell por defecto
        default = "zsh";
        # Comandos que se ejecutan al abrir la terminal
        init = [
          "echo '🚀 Bienvenido a CryptoSwap Development Environment'"
          "echo '📦 Node.js version: $(node -v)'"
          "echo '🔧 Solana version: $(solana --version)'"
        ];
      };
    };

    # Configuración de previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Comando para iniciar el servidor de desarrollo
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"
            "--hostname"
            "0.0.0.0"
          ];
          manager = "web";
          # Configuración de proxy para desarrollo
          proxy = {
            "/api" = "http://localhost:3001";
          };
        };
      };
    };

    # Configuración de caché
    cache = {
      # Directorios a cachear
      directories = [
        "node_modules"
        ".next"
        ".solana"
      ];
    };
  };
}

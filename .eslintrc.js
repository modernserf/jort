module.exports = {
    "env": {
        "commonjs": true,
        "es6": true,
        "node": true,
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-multi-spaces": [
            "off",
        ],
        "no-console": [
            "off",
        ],
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double",
            { avoidEscape: true, allowTemplateLiterals: true }
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-unused-vars": [
            "error",
            { "argsIgnorePattern": "^_" }
        ]
    }
};

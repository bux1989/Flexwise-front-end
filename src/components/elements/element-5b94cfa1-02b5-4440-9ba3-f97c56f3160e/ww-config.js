export default {
  editor: {
    label: {
      en: "Time picker",
    },
    icon: "clock",
    bubble: {
      icon: "clock",
    },
    customStylePropertiesOrder: [
      "lang",
      "format",
      "customFormat",
      [
        "displayTitle",
        "menuPosition",
        "stickedTimePicker",
      ],
      [
        "stylesTitle",
        "themeFontFamily",
        "themeFontSize",
        "themeTimeFontSize",
        "advancedStyles",
        "themeBorderRadius",
        "themeCellBorderRadius",
        "themeCellSize",
        "themeCellPadding",
        "themeMenuMinWidth",
      ],
      [
        "colorsTitle",
        "themePrimaryColor",
        "themeSecondaryColor",
        "themeBackgroundColor",
        "themeTextColor",
        "themePrimaryTextColor",
        "themeHoverColor",
        "themeDisabledColor",
        "advancedColors",
        "themeHoverTextColor",
        "themeHoverIconColor",
        "themeBorderColor",
        "themeMenuBorderColor",
        "themeBorderHoverColor",
        "themeScrollBarBackgroundColor",
        "themeScrollBarColor",
        "themeSuccessColor",
        "themeSuccessDisabledColor",
        "themeIconColor",
        "themeDangerColor",
        "themeHighlightColor",
      ],
    ],
    customSettingsPropertiesOrder: [
      "readonly",
      "required",
      [
        "timeTitle", 
        "use24", 
        "enableSeconds"
      ],
      [
        "behaviorTitle", 
        "autoApply", 
        "closeOnAutoApply"
      ],
    ],
  },
  triggerEvents: [
    {
      name: "change",
      label: { en: "On change" },
      event: { value: "2023-03-02T14:54:54.727Z" },
      getTestEvent: "getTestEvent",
    },
    {
      name: "initValueChange",
      label: { en: "On init value change" },
      event: { value: "2023-03-02T14:54:54.727Z" },
      getTestEvent: "getTestEvent",
    },
  ],
  actions: [
    {
      label: 'Clear',
      action: 'clearValue',
    }
  ],
  properties: {
    initValueSingle: {
      label: {
        en: "Init value",
      },
      type: "Text",
      defaultValue: "08:00",
      bindable: true,
      section: "settings",
    },
    displayTitle: {
      label: {
        en: "Display",
      },
      type: "Title",
      section: "style",
      editorOnly: true,
    },
    stylesTitle: {
      label: {
        en: "Style",
        fr: "Style",
      },
      type: "Title",
      section: "style",
      editorOnly: true,
    },
    colorsTitle: {
      label: {
        en: "Colors",
        fr: "Colors",
      },
      type: "Title",
      section: "style",
      editorOnly: true,
    },
    behaviorTitle: {
      label: {
        en: "Behavior",
      },
      type: "Title",
      section: "settings",
      editorOnly: true,
    },
    timeTitle: {
      label: {
        en: "Time",
      },
      type: "Title",
      section: "settings",
      editorOnly: true,
    },
    stickedTimePicker: {
      label: { en: "Sticked time picker", fr: "Time picker fixé" },
      type: "OnOff",
      defaultValue: false,
      states: true,
      classes: true,
      bindable: true,
      propertyHelp: {
        tooltip: "If set to `true`, the time picker will be rendered at trigger button level and not above all elements. This may be useful in the case of a time picker in a pop-up.",
      },
    },
    menuPosition: {
      label: {
        en: "Menu position",
        fr: "Menu position",
      },
      type: "TextSelect",
      options: {
        options: [
          { value: "center", label: { en: "Center" }, default: true },
          { value: "left", label: { en: "Left" } },
          { value: "right", label: { en: "Right" } },
        ],
      },
      states: true,
      classes: true,
      responsive: true,
      defaultValue: "center",
    },
    enableSeconds: {
      label: { en: "Enable seconds", fr: "Activer les secondes" },
      type: "OnOff",
      section: "settings",
      defaultValue: false,
    },
    use24: {
      label: { en: "24h mode", fr: "Mode 24h" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
      states: true,
      classes: true,
      responsive: true,
    },
    autoApply: {
      label: {
        en: "Auto apply",
      },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
    },
    closeOnAutoApply: {
      label: {
        en: "Close on auto apply",
      },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
    },
    readonly: {
      label: { en: "Read only", fr: "Lecture seule" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
      hidden: (content, sidePanelContent, boundProps, wwProps) =>
        !!(wwProps && wwProps.readonly !== undefined),
    },
    required: {
      label: { en: "Required", fr: "Requis" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
    },
    lang: {
      label: {
        en: "Lang",
        fr: "Lang",
      },
      type: "TextSelect",
      options: () => {
        const options = wwLib.wwWebsiteData
          .getCurrentPage()
          .langs.map((lang) => ({
            value: lang,
            label: { en: lang },
          }));

        options.unshift({ value: "pageLang", label: "Page lang" });

        return { options };
      },
      defaultValue: "pageLang",
      bindable: true,
    },
    format: {
      label: {
        en: "Format",
        fr: "Format",
      },
      type: "TextSelect",
      options: {
        options: [
          { value: "h:mm A", label: { en: "h:mm A" } },
          { value: "h:mm:ss A", label: { en: "h:mm:ss A" } },
          { value: "HH:mm", label: { en: "HH:mm" } },
          { value: "HH:mm:ss", label: { en: "HH:mm:ss" } },
          { value: "custom", label: { en: "Custom" } },
        ],
      },
      defaultValue: "HH:mm",
    },
    customFormat: {
      label: { en: "Custom Format", fr: "Custom Format" },
      type: "Text",
      options: {
        placeholder: "HH:mm",
      },
      bindable: true,
      defaultValue: "",
      hidden: (content) => content.format !== "custom",
    },
    advancedColors: {
      label: { en: "Advanced" },
      section: "style",
      defaultValue: false,
      type: "TextRadioGroup",
      options: {
        choices: [
          { value: true, label: { en: "Show" } },
          { value: false, label: { en: "Hide" } },
        ],
      },
    },
    advancedStyles: {
      label: { en: "Advanced" },
      section: "style",
      defaultValue: false,
      type: "TextRadioGroup",
      options: {
        choices: [
          { value: true, label: { en: "Show" } },
          { value: false, label: { en: "Hide" } },
        ],
      },
    },
    /* ==== THEMING ==== */
    themeFontFamily: {
      type: "FontFamily",
      label: {
        en: "Font family",
      },
      responsive: true,
      states: true,
      classes: true,
    },
    themeFontSize: generateThemeSizingConfig("Font size", 16, 48),
    themeTimeFontSize: generateThemeSizingConfig("Time font size", 32, 48),
    themeBorderRadius: generateThemeSizingConfig("Border radius", 4, 20, true),
    themeCellBorderRadius: generateThemeSizingConfig(
      "Cell border radius",
      4,
      20,
      true
    ),
    themeMenuMinWidth: generateThemeSizingConfig(
      "Menu min width",
      250,
      300,
      true
    ),
    themeCellSize: generateThemeSizingConfig("Cell size", 35, 100, true),
    themeCellPadding: generateThemeSizingConfig("Cell padding", 5, 32, true),

    themePrimaryColor: generateThemeColorConfig("Primary Color", "#1976d2"),
    themeSecondaryColor: generateThemeColorConfig("Secondary Color", "#c0c4cc"),
    themeBackgroundColor: generateThemeColorConfig(
      "Background Color",
      "#ffffff"
    ),
    themeTextColor: generateThemeColorConfig("Text Color", "#212121"),
    themePrimaryTextColor: generateThemeColorConfig(
      "Primary Text Color",
      "#f8f5f5"
    ),
    themeHoverColor: generateThemeColorConfig("Hover Color", "#f3f3f3"),
    themeDisabledColor: generateThemeColorConfig("Disabled Color", "#f6f6f6"),
    themeHoverTextColor: generateThemeColorConfig(
      "Hover Text Color",
      "#212121",
      true
    ),
    themeHoverIconColor: generateThemeColorConfig(
      "Hover Icon Color",
      "#959595",
      true
    ),
    themeBorderColor: generateThemeColorConfig("Border Color", "#ddd", true),
    themeMenuBorderColor: generateThemeColorConfig(
      "Menu Border Color",
      "#ddd",
      true
    ),
    themeBorderHoverColor: generateThemeColorConfig(
      "Border Hover Color",
      "#aaaeb7",
      true
    ),
    themeScrollBarBackgroundColor: generateThemeColorConfig(
      "Scrollbar background Color",
      "#f3f3f3",
      true
    ),
    themeScrollBarColor: generateThemeColorConfig(
      "Scrollbar Color",
      "#959595",
      true
    ),
    themeSuccessColor: generateThemeColorConfig(
      "Success Color",
      "#76d275",
      true
    ),
    themeSuccessDisabledColor: generateThemeColorConfig(
      "Success Disabled Color",
      "#a3d9b1",
      true
    ),
    themeIconColor: generateThemeColorConfig("Icon Color", "#959595", true),
    themeDangerColor: generateThemeColorConfig("Danger Color", "#ff6f60", true),
    themeHighlightColor: generateThemeColorConfig(
      "Highlight Color",
      "#1976d219",
      true
    ),
    triggerZone: {
      hidden: true,
      defaultValue: [
        {
          isWwObject: true,
          type: "ww-text",
          state: {
            name: "Time input",
          },
        },
      ],
      navigator: {
        group: "Trigger",
      },
    },
    actionSelectElement: {
      hidden: false,
      defaultValue: {
        isWwObject: true,
        type: "ww-button",
        state: {
          name: "OK button",
        },
        content: {
          default: {
            text: "OK"
          }
        },
      },
      navigator: {
        group: "Actions",
      },
    },
  },
};

function generateThemeColorConfig(label, defaultValue, advanced) {
  return {
    label: {
      en: label,
    },
    type: "Color",
    defaultValue: defaultValue,
    bindable: true,
    responsive: true,
    states: true,
    classes: true,
    hidden: advanced ? (content) => !content.advancedColors : undefined,
  };
}

function generateThemeSizingConfig(label, defaultValue, max, advanced) {
  return {
    type: "Length",
    label: {
      en: label,
    },
    bindable: true,
    options: {
      unitChoices: [{ value: "px", label: "px", min: 1, max }],
    },
    responsive: true,
    classes: true,
    states: true,
    defaultValue: defaultValue + "px",
    hidden: advanced ? (content) => !content.advancedStyles : undefined,
  };
}

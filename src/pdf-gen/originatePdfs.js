import { sectionHandlerLookup } from "./sectionHandlerLookup";

import templates from "./HTML";
export const originatePdfs = async (options, doPdfCallback = null) => {
  // Set up workspace - options.workingDir should already exist

  let links = [];
  let manifest = [];
  let wrapperRange = null;

  const doSection = async (section, nested) => {
    options.verbose &&
      nested &&
      console.log(
        `   Section ${section.id.replace("%%bookCode%%", wrapperRange)} (${section.type} in wrapper)`,
      );
    if (section.forceSkip) {
      options.verbose &&
        console.log(`      Force skip in config file; continuing...`);
      return;
    }
    links.push(
      templates["web_index_page_link"].replace(
        /%%ID%%/g,
        section.id.replace("%%bookCode%%", wrapperRange),
      ),
    );
    if (["fourColumnSpread", "twoColumn"].includes(section.type)) {
      links.push(
        templates["web_index_page_link"].replace(
          /%%ID%%/g,
          `${section.id.replace("%%bookCode%%", wrapperRange)}_superimpose`,
        ),
      );
      // manifest.push({
      //   id: `${section.id.replace("%%bookCode%%", wrapperRange)}_superimpose`,
      //   type: "superimpose",
      //   for: section.id.replace("%%bookCode%%", wrapperRange),
      // });
    }
    const sectionHandler = sectionHandlerLookup[section.type];
    if (!sectionHandler) {
      throw new Error(
        `Unknown section type '${section.type}' (id '${section.id}')`,
      );
    }
    await sectionHandler.doSection({
      section,
      templates,
      wrapperRange,
      manifest,
      options,
    });
    if (section.forceQuit) {
      console.log("** Force quit in config file **");
      process.exit(0);
    }
  };

  for (const section of options.configContent.sections) {
    options.verbose &&
      console.log(
        `   Section ${section.id ? `${section.id} (${section.type})` : section.type}`,
      );
    doPdfCallback &&
      doPdfCallback({
        type: "section",
        level: 1,
        msg: `Section or wrapper ${section.type}`,
        args: [section.type],
      });

    switch (section.type) {
      case "obsWrapper":
        options.verbose && console.log(`      obsRanges`);
        for (const obsRange of section.ranges) {
          options.verbose && console.log(`      obsRange = ${obsRange}`);
          const [firstStory, lastStory] = obsRange
            .split("-")
            .map((n) => parseInt(n));
          for (const section2 of section.sections) {
            doPdfCallback &&
              doPdfCallback({
                type: "wrappedSection",
                level: 2,
                msg: `Wrapped section ${section2.type}`,
                args: [section2.type, obsRange],
              });
            await doSection(
              {
                ...section2,
                firstStory,
                lastStory: lastStory || firstStory,
                doPdfCallback,
              },
              true,
            );
          }
        }
        break;
      case "bcvWrapper":
        options.verbose && console.log(`      bcvRanges`);
        for (const bcvRange of section.ranges) {
          options.verbose && console.log(`      bcvRange = ${bcvRange}`);
          for (const section2 of section.sections) {
            doPdfCallback &&
              doPdfCallback({
                type: "wrappedSection",
                level: 2,
                msg: `Wrapped section ${section2.type}`,
                args: [section2.type, bcvRange],
              });
            await doSection({ ...section2, bcvRange, doPdfCallback }, true);
          }
        }
        break;
      default:
        await doSection({ ...section, doPdfCallback }, false);
    }
  }
  // fse.writeFileSync(
  //     path.join(options.htmlPath, "index.html"),
  //     templates['web_index_page']
  //         .replace("%%LINKS%%", links.join("\n"))
  // );
  return manifest;
  // fse.writeJsonSync(
  //     options.manifestPath,
  //     manifest
  // )
};

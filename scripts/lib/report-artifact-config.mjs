export const REPORTS = {
  "account-company-save-flow": {
    artifactName: "account-company-save-flow-report",
    title: "Account company save-flow report",
    expectedSteps: [
      {
        name: "signed-in company profile opened",
        screenshot: "01-company-profile-loaded.png",
      },
      {
        name: "invalid contacts blocked",
        screenshot: "02-contacts-validation-error.png",
      },
      {
        name: "valid contacts saved",
        screenshot: "03-contacts-saved.png",
      },
      {
        name: "saved contacts survived reload",
        screenshot: "04-contacts-after-reload.png",
      },
    ],
  },
  "account-products-save-flow": {
    artifactName: "account-products-save-flow-report",
    title: "Account products matrix save-flow report",
    expectedSteps: [
      {
        name: "signed-in product matrix opened",
        screenshot: "01-products-matrix-loaded.png",
      },
      {
        name: "incomplete product blocked",
        screenshot: "02-product-validation-error.png",
      },
      {
        name: "new selling product saved",
        screenshot: "03-product-added.png",
      },
      {
        name: "duplicate product blocked",
        screenshot: "04-product-duplicate-blocked.png",
      },
      {
        name: "pagination advances through matrix",
        screenshot: "05-product-pagination-page-two.png",
      },
      {
        name: "filtered view shared",
        screenshot: "06-product-filter-share-link.png",
      },
      {
        name: "detail panel starts edit flow",
        screenshot: "07-product-detail-edit-saved.png",
      },
      {
        name: "delete and reload persistence verified",
        screenshot: "08-product-delete-after-reload.png",
      },
      {
        name: "Russian product matrix remains localized",
        screenshot: "09-product-ru-localized.png",
      },
    ],
  },
};

export const reportNames = Object.keys(REPORTS);

export const expectedScreenshotsFor = (report) =>
  report.expectedSteps.map((step) => step.screenshot);

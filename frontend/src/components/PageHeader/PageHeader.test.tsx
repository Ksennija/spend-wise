import { render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
  it("shows the title as the page's h1 with the subtitle under it", () => {
    render(<PageHeader title="Overview" subtitle="A clear picture of your money" />);

    const heading = screen.getByRole("heading", { level: 1, name: "Overview" });
    const subtitle = screen.getByText("A clear picture of your money");
    expect(heading.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("is a header element", () => {
    const { container } = render(<PageHeader title="Transactions" subtitle="Manage and track your money" />);

    expect(container.querySelector("header")).not.toBeNull();
  });

  it("shows its controls after the title", () => {
    render(
      <PageHeader title="Overview" subtitle="A clear picture of your money">
        <button type="button">Import transactions</button>
        <button type="button">Next month</button>
      </PageHeader>
    );

    const heading = screen.getByRole("heading", { name: "Overview" });
    for (const name of ["Import transactions", "Next month"]) {
      const control = screen.getByRole("button", { name });
      expect(heading.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("has no place for controls when there are none", () => {
    const { container } = render(<PageHeader title="Overview" subtitle="A clear picture of your money" />);

    expect(container.querySelector("header")?.children).toHaveLength(1);
  });

  it("has no place for controls when the page has nothing to show there yet", () => {
    const shown = false;
    const { container } = render(
      <PageHeader title="Transactions" subtitle="Manage and track your money">
        {shown && <button type="button">Next month</button>}
      </PageHeader>
    );

    expect(container.querySelector("header")?.children).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

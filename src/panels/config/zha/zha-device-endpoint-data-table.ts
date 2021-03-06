import {
  customElement,
  html,
  LitElement,
  property,
  query,
  TemplateResult,
  css,
  CSSResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import "../../../components/data-table/ha-data-table";
import type {
  DataTableColumnContainer,
  HaDataTable,
  DataTableRowData,
} from "../../../components/data-table/ha-data-table";
import "../../../components/entity/ha-state-icon";
import type { ZHADeviceEndpoint, ZHAEntityReference } from "../../../data/zha";
import { showZHADeviceInfoDialog } from "../../../dialogs/zha-device-info-dialog/show-dialog-zha-device-info";
import type { HomeAssistant } from "../../../types";

export interface DeviceEndpointRowData extends DataTableRowData {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  endpoint_id: number;
  entities: ZHAEntityReference[];
}

@customElement("zha-device-endpoint-data-table")
export class ZHADeviceEndpointDataTable extends LitElement {
  @property({ type: Object }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ type: Boolean }) public selectable = false;

  @property({ type: Array }) public deviceEndpoints: ZHADeviceEndpoint[] = [];

  @query("ha-data-table") private _dataTable!: HaDataTable;

  private _deviceEndpoints = memoizeOne(
    (deviceEndpoints: ZHADeviceEndpoint[]) => {
      const outputDevices: DeviceEndpointRowData[] = [];

      deviceEndpoints.forEach((deviceEndpoint) => {
        outputDevices.push({
          name:
            deviceEndpoint.device.user_given_name || deviceEndpoint.device.name,
          model: deviceEndpoint.device.model,
          manufacturer: deviceEndpoint.device.manufacturer,
          id: deviceEndpoint.device.ieee + "_" + deviceEndpoint.endpoint_id,
          ieee: deviceEndpoint.device.ieee,
          endpoint_id: deviceEndpoint.endpoint_id,
          entities: deviceEndpoint.entities,
        });
      });

      return outputDevices;
    }
  );

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: "Devices",
              sortable: true,
              filterable: true,
              direction: "asc",
              grows: true,
              template: (name) => html`
                <div
                  class="mdc-data-table__cell table-cell-text"
                  @click=${this._handleClicked}
                  style="cursor: pointer;"
                >
                  ${name}
                </div>
              `,
            },
            endpoint_id: {
              title: "Endpoint",
              sortable: true,
              filterable: true,
            },
          }
        : {
            name: {
              title: "Name",
              sortable: true,
              filterable: true,
              direction: "asc",
              grows: true,
              template: (name) => html`
                <div
                  class="mdc-data-table__cell table-cell-text"
                  @click=${this._handleClicked}
                  style="cursor: pointer;"
                >
                  ${name}
                </div>
              `,
            },
            endpoint_id: {
              title: "Endpoint",
              sortable: true,
              filterable: true,
            },
            entities: {
              title: "Associated Entities",
              sortable: false,
              filterable: false,
              width: "50%",
              template: (entities) => html`
                ${entities.length
                  ? entities.length > 3
                    ? html`${entities.slice(0, 2).map(
                          (entity) =>
                            html`<div
                              style="overflow: hidden; text-overflow: ellipsis;"
                            >
                              ${entity.name || entity.original_name}
                            </div>`
                        )}
                        <div>And ${entities.length - 2} more...</div>`
                    : entities.map(
                        (entity) =>
                          html`<div
                            style="overflow: hidden; text-overflow: ellipsis;"
                          >
                            ${entity.name || entity.original_name}
                          </div>`
                      )
                  : "This endpoint has no associated entities"}
              `,
            },
          }
  );

  public clearSelection() {
    this._dataTable.clearSelection();
  }

  protected render(): TemplateResult {
    return html`
      <ha-data-table
        .columns=${this._columns(this.narrow)}
        .data=${this._deviceEndpoints(this.deviceEndpoints)}
        .selectable=${this.selectable}
        auto-height
      ></ha-data-table>
    `;
  }

  private async _handleClicked(ev: CustomEvent) {
    const rowId = ((ev.target as HTMLElement).closest(
      ".mdc-data-table__row"
    ) as any).rowId;
    const ieee = rowId.substring(0, rowId.indexOf("_"));
    showZHADeviceInfoDialog(this, { ieee });
  }

  static get styles(): CSSResult[] {
    return [
      css`
        .table-cell-text {
          word-break: break-word;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zha-device-endpoint-data-table": ZHADeviceEndpointDataTable;
  }
}

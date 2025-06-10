import { setToast } from "$lib/results.svelte";
import type * as api from "@raycast/api";

export class Toast {
  public static readonly Style = {
    Success: "SUCCESS",
    Failure: "FAILURE",
    Animated: "ANIMATED",
  };

  public style: "SUCCESS" | "FAILURE" | "ANIMATED";
  public title: string;
  public message: string | undefined;
  public primaryAction: api.Toast.ActionOptions | undefined;
  public secondaryAction: api.Toast.ActionOptions | undefined;

  constructor(props: api.Toast.Options) {
    this.style = props.style ?? "SUCCESS"; // TODO: is this default value correct?
    this.title = props.title;
    this.message = props.message;
    this.primaryAction = props.primaryAction;
    this.secondaryAction = props.secondaryAction;
  }

  async show(): Promise<void> {
    setToast(this);
  }

  async hide(): Promise<void> {
    setToast(null);
  }
}

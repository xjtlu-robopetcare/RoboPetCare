# K230 Firmware Download and Flashing

## Table of Contents

- [About CanMV K230 Firmware](#about-canmv-k230-firmware)
- [Prepare the Devices](#prepare-the-devices)
- [Download the Firmware](#download-the-firmware)
- [Connect the K230 Device](#connect-the-k230-device)
- [Install the K230 Driver](#install-the-k230-driver)
- [Install the Flashing Tool](#install-the-flashing-tool)
- [Configure the Flashing Tool](#configure-the-flashing-tool)
- [Flash the Firmware](#flash-the-firmware)
- [Verify the Result](#verify-the-result)

## About CanMV K230 Firmware

1. **What is firmware?**

   You can think of it as the operating system of a phone or computer.

2. **When do you need to flash the firmware?**

   If the package you purchased does not include a TF card, you need to prepare a TF card larger than 4 GB, flash the firmware to it, and then insert the TF card into the TF card slot to use the K230 vision module. If your package already includes a TF card, the firmware has been pre-flashed at the factory and you can simply insert the card and use it.

3. **Can I flash third-party firmware?**

   Because the firmware contains pin definitions, peripheral drivers, and other configurations, flashing third-party K230 firmware is not recommended — it may lead to incompatibility issues.

## Prepare the Devices

You need a K230 vision module, a TF card larger than 4 GB, a Type-C data cable, and a Windows PC.

> **Note:** If the TF card contains data, back it up first — it may be wiped.

## Download the Firmware

Download the factory firmware from the K230 vision module resources. The file is named:

```
CanMV_K230_YAHBOOM_micropython_Vx.x.x.img.gz
```

where `Vx.x.x` is the version number.

After extracting the file, you will get the firmware image:

```
CanMV_K230_YAHBOOM_micropython_local_nncase_v2.9.0.img
```

## Connect the K230 Device

1. Make sure the TF card is removed from the K230 module's TF card slot.
2. Use a Type-C data cable to connect the K230 module to a USB port on the PC.

On the first connection, the Device Manager will show **K230 USB Boot Device** with a yellow exclamation mark — you need to install the driver first.

> **Note:** The K230 vision module draws a relatively large amount of power, so please connect it via a **USB 3.0** port.

## Install the K230 Driver

Download the driver tool `zadig-2.9.exe` from the K230 vision module resources.

Double-click the file, select **K230 USB Boot Device**, then click **Install Driver** to begin installation.

> **Note:** The driver only needs to be installed once.

After installation, unplug and reconnect the K230 vision module. The exclamation mark should disappear, indicating that the driver was installed successfully.

## Install the Flashing Tool

Download the flashing tool `K230BurningTool-Windows.zip` from the K230 vision module resources.

Extract the archive, locate `K230BurningTool.exe`, and double-click to open it.

> **Note:** The extraction path must NOT contain any Chinese (non-ASCII) characters.

## Configure the Flashing Tool

1. Click the **Open** button and select the firmware image you just extracted. Make sure the **image** checkbox is checked.
2. Set **Target Media** to **SD Card**.

## Flash the Firmware

Insert the prepared TF card into the K230 vision module's TF card slot, then click the **Start** button to begin flashing.

Wait until the progress bar reaches 100%, then click **Confirm** to complete the process.

## Verify the Result

Unplug and re-plug the Type-C cable of the K230 vision module to power-cycle it.

> **Note:** After flashing, the first boot needs to initialize the TF card contents, so the system may report an "unrecognized USB device" error. Simply unplug and reconnect the Type-C cable.

Once reconnected, if **OpenMV Cam USB COM Port** (e.g. `COM23`) appears under **Ports (COM & LPT)** in Device Manager, the device is running successfully.

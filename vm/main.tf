variable "do_token" {
  type = string
}

provider "digitalocean" {
  token = var.do_token
}

# ---------------------------------------------------
# 1. CREATE SSH KEY ON DIGITALOCEAN
# ---------------------------------------------------
resource "digitalocean_ssh_key" "local" {
  name       = "opentofu-key"
  public_key = trimspace(file("~/.ssh/id_ed25519.pub"))
}

# ---------------------------------------------------
# 2. CREATE THE DROPLET
# ---------------------------------------------------
resource "digitalocean_droplet" "server" {
  name   = "tofu-basic"
  region = "nyc1"
  size   = "s-1vcpu-1gb"
  image  = "ubuntu-22-04-x64"

  ssh_keys = [digitalocean_ssh_key.local.id]

  user_data = <<EOF
#cloud-config
packages:
  - git

runcmd:
  - git clone https://github.com/ronakmystery/game.git /root/your-repo
EOF
}

# ---------------------------------------------------
# 3. FIREWALL (fixed droplet reference + full rules)
# ---------------------------------------------------
resource "digitalocean_firewall" "zombie_fw" {
  name        = "zombie-fw"
  droplet_ids = [digitalocean_droplet.server.id]

  # ---------------------------
  # INBOUND RULES
  # ---------------------------
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "20000-26000"
    source_addresses = ["0.0.0.0/0"]
  }

  # ---------------------------
  # OUTBOUND RULES  (IMPORTANT)
  # ---------------------------

  # TCP (already correct)
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  # UDP (required for DNS!)
  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  # ICMP (makes ping work, optional but recommended)
  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0"]
  }
}

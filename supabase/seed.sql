-- DanceDeck Competition Profile Seeds
-- These are the major competition organizations with their adjudication tier systems

insert into competition_profiles (organization_name, adjudication_tiers, is_custom) values
  ('Spotlight Dance Cup', '{
    "tiers": ["Platinum", "High Gold", "Gold", "High Silver", "Silver"],
    "tier_colors": {
      "Platinum": "#C084FC",
      "High Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "High Silver": "#94A3B8",
      "Silver": "#64748B"
    }
  }', false),

  ('KAR (Kids Artistic Revue)', '{
    "tiers": ["Platinum", "High Gold", "Gold", "High Silver", "Silver", "High Bronze", "Bronze"],
    "tier_colors": {
      "Platinum": "#C084FC",
      "High Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "High Silver": "#94A3B8",
      "Silver": "#64748B",
      "High Bronze": "#D97706",
      "Bronze": "#92400E"
    }
  }', false),

  ('Count It Dance', '{
    "tiers": ["Platinum", "High Gold", "Gold", "Silver"],
    "tier_colors": {
      "Platinum": "#C084FC",
      "High Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "Silver": "#64748B"
    }
  }', false),

  ('Starbound National Talent Competition', '{
    "tiers": ["Superstar", "5 Star", "High Gold", "Gold", "High Silver", "Silver"],
    "tier_colors": {
      "Superstar": "#C084FC",
      "5 Star": "#F472B6",
      "High Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "High Silver": "#94A3B8",
      "Silver": "#64748B"
    }
  }', false),

  ('Nuvo Dance Convention', '{
    "tiers": ["Platinum", "Gold", "Silver", "Bronze"],
    "tier_colors": {
      "Platinum": "#C084FC",
      "Gold": "#FCD34D",
      "Silver": "#64748B",
      "Bronze": "#92400E"
    }
  }', false),

  ('Star Power Talent Competition', '{
    "tiers": ["Power Pak Grand Champion", "Power Pak 1st Runner Up", "Power Pak", "5 Star", "4 Star", "3 Star"],
    "tier_colors": {
      "Power Pak Grand Champion": "#C084FC",
      "Power Pak 1st Runner Up": "#F472B6",
      "Power Pak": "#F59E0B",
      "5 Star": "#FCD34D",
      "4 Star": "#94A3B8",
      "3 Star": "#64748B"
    }
  }', false),

  ('Showstopper', '{
    "tiers": ["Showstopper", "Gold", "High Silver", "Silver"],
    "tier_colors": {
      "Showstopper": "#C084FC",
      "Gold": "#FCD34D",
      "High Silver": "#94A3B8",
      "Silver": "#64748B"
    }
  }', false),

  ('New York Dance Alliance (NYDA)', '{
    "tiers": ["Outstanding", "High Score Gold", "Gold", "High Score Silver", "Silver"],
    "tier_colors": {
      "Outstanding": "#C084FC",
      "High Score Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "High Score Silver": "#94A3B8",
      "Silver": "#64748B"
    }
  }', false),

  ('The Dance Awards (TDA)', '{
    "tiers": ["Best in Show", "Outstanding", "High Scoring", "Scoring"],
    "tier_colors": {
      "Best in Show": "#C084FC",
      "Outstanding": "#F59E0B",
      "High Scoring": "#FCD34D",
      "Scoring": "#94A3B8"
    }
  }', false),

  ('Custom / Other', '{
    "tiers": ["Platinum", "High Gold", "Gold", "High Silver", "Silver"],
    "tier_colors": {
      "Platinum": "#C084FC",
      "High Gold": "#F59E0B",
      "Gold": "#FCD34D",
      "High Silver": "#94A3B8",
      "Silver": "#64748B"
    }
  }', true);
